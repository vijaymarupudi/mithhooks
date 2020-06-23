## What is a registration?

A registration is an object that fully or partially fulfills the criteria of a mithril component.

A registration is a superset of a component.

## Hook examples

```javascript
const mithPerformanceTime = () => {

  const mtime = mithState(performance.now())
    let on = false;

  const start = () => {
    on = true;
    requestAnimationFrame(function callback() {
        if (!on) return;
        mtime(performance.now())
        requestAnimationFrame(callback)
        })
  }

  const stop = () => {
    on = false;
  }

  const registration = {
    oncreate() {
      start();
    },
    onremove() {
      stop();
    }
  }

  return [mtime, registration]
}
```
