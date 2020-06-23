import m from 'mithril'

export const mithState = initialState => {
  let state = initialState;
  return function(newState) {
    if (newState === undefined) {
      return state;
    }
    state = newState;
    m.redraw();
  };
};
