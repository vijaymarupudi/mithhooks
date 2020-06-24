import m from "mithril";

// Internal props have underscores so that terser can mangle property names.

// Effect Types

type CleanupFn = () => void;
type EffectFn = () => CleanupFn | void;
type EffectItem = {
  _fn: EffectFn;
  _cleanupfn?: CleanupFn;
  _newDependencies?: Array<any>;
  _oldDependencies?: Array<any>;
};

// useState types

type Setter<T> = (x: T) => T;
type SetState<T> = (x: T | Setter<T>) => void;
type UseStateReturn<T> = [T, SetState<T>];
type StateItem<T> = {
  _state: T;
  _setState: SetState<T>;
}

// useRefTypes

type Ref<T> = {
  current: T;
};

const areEqualArrays = (a: Array<any>, b: Array<any>) => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

// global references for convenient hooks
let currentStateHookState: Array<any> | undefined;
let currentStateHookStateIdx: number | undefined;
let currentEffectHookState: Array<EffectItem> | undefined;
let currentEffectHookStateIdx: number | undefined;

export const useRef = <T extends {}>(initialValue: T): Ref<T> => {
  // so that it refers to the correct idx in setRef();
  const idx = currentStateHookStateIdx as number;

  // type assertion
  const hookRefState = currentStateHookState as Ref<T>[];

  if (hookRefState[idx] === undefined) {
    hookRefState[idx] = { current: initialValue };
  }

  // wrap up for next hook;
  currentStateHookStateIdx = idx + 1;
  return hookRefState[idx];
};


export const useState = <T>(initialState: T): UseStateReturn<T> => {
  // so that it refers to the correct idx in setState();
  const idx = currentStateHookStateIdx as number;

  // type assertion
  const stateHookState = currentStateHookState as StateItem<T>[];

  if (currentStateHookState![idx] === undefined) {

    // the only thing this captures is the index, and the stateHookState;
    const setState: SetState<T> = newState => {
      const finalNewState: T =
        typeof newState === "function"
          ? (newState as (x: T) => T)(stateHookState[idx]._state)
          : newState;
      stateHookState[idx] = { _state: finalNewState, _setState: setState };
      m.redraw();
    };
    stateHookState[idx] = { _state: initialState, _setState: setState }

  }


  // this can change
  const state = stateHookState[idx]._state;
  // this never changes after first assignment
  const setState = stateHookState[idx]._setState;

  // wrap up for next hook;
  currentStateHookStateIdx = idx + 1;
  return [state, setState];
};

export const useEffect = (
  userfn: EffectFn,
  dependencies?: Array<any>
): void => {
  const idx = currentEffectHookStateIdx as number;

  // registering hook for the first time
  if (!currentEffectHookState![idx]) {
    currentEffectHookState![idx] = {
      _fn: userfn,
      _newDependencies: dependencies
    };
  } else {
    currentEffectHookState![idx]._fn = userfn;
    currentEffectHookState![idx]._newDependencies = dependencies;
  }

  // wrap up for next hook;
  currentEffectHookStateIdx!++;
};

export const withHooks = <T>(
  viewfn: (attrs: T) => m.Children | null | void
): m.ClosureComponent<T> => {
  // returns a closure component, new state per component.

  return function() {
    // actually contains the state, initializing.
    const stateHookState: Array<any> = [];
    const effectHookState: Array<EffectItem> = [];

    const update = () => {
      effectHookState.forEach(effect => {
        // if stale, we gotta run the effect
        let stale = false;
        if (!effect._newDependencies) {
          stale = true;
        }
        if (effect._oldDependencies && effect._newDependencies) {
          if (
            !areEqualArrays(effect._oldDependencies, effect._newDependencies)
          ) {
            stale = true;
          }
        }
        if (!stale) {
          return;
        }
        if (effect._cleanupfn) {
          effect._cleanupfn();
        }
        const cleanup = effect._fn();
        if (cleanup) {
          effect._cleanupfn = cleanup;
        }
        // update record of dependencies
        effect._oldDependencies = effect._newDependencies;
        // TODO: dev flag this line, not necessary in production
        effect._newDependencies = undefined;
      });
    };

    const newviewfn = (vnode: m.Vnode<T>) => {
      // initial StateHookState
      currentStateHookState = stateHookState;
      currentStateHookStateIdx = 0;
      // initial EffectHookState
      currentEffectHookState = effectHookState;
      currentEffectHookStateIdx = 0;
      // run the view function;
      const rendered = viewfn(vnode.attrs);
      // Not necessary, but undefined behavior so doing this to prevent bugs;
      // TODO: don't include this part in a production build.
      currentStateHookStateIdx = undefined;
      currentStateHookStateIdx = undefined;
      currentEffectHookState = undefined;
      currentEffectHookStateIdx = undefined;
      return rendered;
    };

    return {
      oncreate() {
        // run all the effects;
        effectHookState.forEach(effect => {
          const cleanup = effect._fn();
          if (cleanup) {
            effect._cleanupfn = cleanup;
          }
          effect._oldDependencies = effect._newDependencies;
        });
      },
      onupdate: update,
      onremove() {
        effectHookState.forEach(effect => {
          if (effect._cleanupfn) {
            effect._cleanupfn();
          }
        });
      },
      view: newviewfn
    };
  };
};
