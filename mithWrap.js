const closuredComponent = component => {
  if (typeof component === "object") {
    return () => component;
  }
  return component;
};

export const mergeRegistrations = components => {
  // an array of lifecycle method names as key and arrays of methods as values.
  let collection = {};
  for (const component of components) {
    for (const [key, value] of Object.entries(component)) {
      if (!collection[key]) {
        collection[key] = [];
      }
      collection[key].push(value);
    }
  }

  let ret = {};

  for (const [key, methods] of Object.entries(collection)) {
    switch (key) {
      case "view":
        ret[key] = methods[0];
        break;
      case "onbeforeupdate":
        ret[key] = function(...args) {
          const results = methods.map(method => method.bind(this)(...args));
          return results.every(value => value === false);
        };
        break;
      case "onbeforeremove":
        ret[key] = function(...args) {
          return Promise.all(methods.map(method => method.bind(this)(...args)));
        };
        break;
      default:
        ret[key] = function(...args) {
          methods.forEach(method => {
            method.bind(this)(...args);
          });
        };
    }
  }

  return ret;
};

function mergeComponentRegistrations(
  componentWithOrWithoutRegistrations
) {
  const { registrations } = componentWithOrWithoutRegistrations;
  if (!registrations) return componentWithOrWithoutRegistrations;
  // recursively handle registrations
  const newRegistrations = registrations.map(mergeComponentRegistrations);
  delete componentWithOrWithoutRegistrations.registrations;
  return mergeRegistrations([
    ...newRegistrations,
    componentWithOrWithoutRegistrations
  ]);
}

export const mithWrap = userComponent => {
  const componentFactory = closuredComponent(userComponent);
  const wrappedComponent = (...args) => {
    const component = componentFactory(...args);
    return mergeComponentRegistrations(component);
  };
  return wrappedComponent;
};
