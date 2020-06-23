"use strict";

import m from "mithril";
import {
  mithState,
  mithWrap,
  mithEffect,
  mergeRegistrations
} from "./mithHooks";

// f suffix means function
const mithInterval = (msf, userFunc) => {
  return mithEffect(
    v => [msf(v)],
    v => {
      userFunc();
      const id = setInterval(userFunc, msf(v));
      return () => clearInterval(id);
    }
  );
};

const mithTime = msf => {
  const mtime = mithState(performance.now());
  const registration = mithInterval(msf, () => {
    mtime(performance.now());
  });
  return [mtime, registration];
};

const mithDateTime = msf => {
  const mdatetime = mithState(new Date().valueOf());
  const registration = mithInterval(msf, () => {
    mdatetime(new Date().valueOf());
  });
  return [mdatetime, registration];
};

const mithInformation = msf => {
  const [mtime, r1] = mithTime(msf);
  const [mdatetime, r2] = mithDateTime(() => 2000);
  const minformation = mithState(`${mtime()}, ${mdatetime()}`);

  const r3 = mithEffect(
    () => [mtime(), mdatetime()],
    () => {
      minformation(`${mtime()}, ${mdatetime()}`);
    }
  );

  return [minformation, mergeRegistrations([r1, r2, r3])];
};

const Timer = mithWrap(() => {
  const [minformation, r] = mithInformation(v => v.attrs.ms);

  return {
    view() {
      return minformation();
    },
    registrations: [r]
  };
});

const Page = mithWrap(() => {
  const mms = mithState(1000);

  return {
    view() {
      return m(
        "div",
        m("div", "Hello: ", m(Timer, { ms: mms() })),
        m(
          "p",
          m("input", {
            type: "range",
            oninput: e => {
              mms(e.target.valueAsNumber * 10);
            }
          })
        )
      );
    }
  };
});

m.mount(document.body, Page);
