import m from "mithril";

type CleanupFn = () => void;

type EffectFn = () => CleanupFn | void;

type EffectItem = {
  _fn: EffectFn;
  _cleanupfn?: CleanupFn;
  _newDependencies?: Array<any>;
  _oldDependencies?: Array<any>;
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
let currentRefHookState: Array<any> | undefined;
let currentRefHookStateIdx: number | undefined;
let currentEffectHookState: Array<EffectItem> | undefined;
let currentEffectHookStateIdx: number | undefined;

export const useRef = <T>(initialRef: T) => {
  // so that it refers to the correct idx in setRef();
  const idx = currentRefHookStateIdx as number;

  // type assertion
  const hookRef = currentRefHookState!;

  if (currentRefHookState![idx] === undefined) {
    hookRef[idx] = initialRef;
  }

  const ret = [
    hookRef[idx],
    (newRef: T) => {
      hookRef[idx] = newRef;
    }
  ];

  // wrap up for next hook;
  currentRefHookStateIdx = idx + 1;
  return ret;
};

export const useState = <T>(initialState: T) => {
  // so that it refers to the correct idx in setState();
  const idx = currentStateHookStateIdx as number;

  // type assertion
  const hookState = currentStateHookState!;

  if (currentStateHookState![idx] === undefined) {
    hookState[idx] = initialState;
  }

  const ret = [
    hookState[idx],
    (newState: T) => {
      hookState[idx] = newState;
      m.redraw();
    }
  ];

  // wrap up for next hook;
  currentStateHookStateIdx = idx + 1;
  return ret;
};

export const useEffect = (userfn: EffectFn, dependencies?: Array<any>) => {
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

export const withHooks = (viewfn: () => m.Vnode) => {
  // actually contains the state;
  const stateHookState: Array<any> = [];
  const effectHookState: Array<EffectItem> = [];

  const newviewfn = () => {
    // initial StateHookState
    currentStateHookState = stateHookState;
    currentStateHookStateIdx = 0;
    // initial EffectHookState
    currentEffectHookState = effectHookState;
    currentEffectHookStateIdx = 0;
    // initial RefHookState
    currentRefHookState = []
    currentRefHookStateIdx = 0
    // run the view function;
    const rendered = viewfn();
    // Not necessary, but undefined behavior so doing this to prevent bugs;
    // TODO: don't include this part in a production build.
    currentStateHookStateIdx = undefined;
    currentStateHookStateIdx = undefined;
    currentEffectHookState = undefined;
    currentEffectHookStateIdx = undefined;
    currentRefHookState = undefined;
    currentRefHookStateIdx = undefined;
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
    onupdate() {
      effectHookState.forEach(effect => {
        let stale = false;
        if (!effect._newDependencies) {
          stale = true;
        }
        if (effect._oldDependencies && effect._newDependencies) {
          if (!areEqualArrays(effect._oldDependencies, effect._newDependencies)) {
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
      });
    },
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

