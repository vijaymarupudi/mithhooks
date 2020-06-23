"use strict";

import m from "mithril";
import { withHooks, useState, useEffect } from "./mithHooks";

const useTime = (ms: number) => {
  const [time, setTime] = useState(performance.now());

  useEffect(() => {
    const id = setInterval(() => {
      setTime(performance.now());
    }, ms);
    return () => clearInterval(id);
  }, [ms]);

  return time;
};

const App = withHooks(() => {
  const [ms, setMS] = useState(100);
  const time = useTime(ms);

  return m(
    "div",
    m('p', ms),
    m("p", time.toString()),
    m("input", {
      type: "range",
      oninput: (e: InputEvent) =>
        setMS((e.target as HTMLInputElement).valueAsNumber * 10)
    })
  );
});

m.mount(document.body, App);
