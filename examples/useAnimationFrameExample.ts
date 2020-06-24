"use strict";

import m from "mithril";
import { withHooks, useState, useEffect, useRef } from "../mithHooks";

function useAnimationFrame(func: () => void, deps: any[]) {
  const onRef = useRef(false);

  useEffect(() => {
    onRef.current = true;

    const callback = () => {
      if (!onRef.current) {
        return;
      }
      func();
      requestAnimationFrame(callback);
    };

    requestAnimationFrame(callback);

    return () => {
      onRef.current = false;
    };
  }, deps);
}

const Sub = withHooks(() => {
  const [counter, setCounter] = useState(0);

  useAnimationFrame(() => {
    setCounter(c => c + 1);
  }, []);

  return counter.toString();
});

const App = withHooks(() => {
  const [toggle, setToggle] = useState(false);

  return m("div", [
    m("button", { onclick: () => setToggle(!toggle) }, "Toggle"),
    toggle && m("div", m(Sub))
  ]);
});

m.mount(document.body, App);
