// returns a registration
//
const equalDependencies = (a, b) => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

export const mithEffect = (dependencyFunc, userFunc) => {
  let cleanup;
  let oldDependencies;

  return {
    oncreate(...args) {
      oldDependencies = dependencyFunc(...args);
      cleanup = userFunc(...args);
    },
    onupdate(...args) {
      let newDependencies = dependencyFunc(...args);
      if (!equalDependencies(oldDependencies, newDependencies)) {
        oldDependencies = newDependencies;
        cleanup && cleanup();
        cleanup = userFunc(...args);
      }
    },
    onremove() {
      cleanup && cleanup();
    }
  };
};
