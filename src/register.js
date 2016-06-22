export function defineComponent(componentName, componentDef) {
  var componentProto = Object.create(HTMLElement.prototype, {
    createdCallback: {
      value: function() {
        componentDef.createDOM.call(this);
        this.rootEl = this.shadowRoot || this;
        const upgradeEl = mdlEl => {
          const el = this.rootEl.querySelector(mdlEl);
          if (el) {
            window.componentHandler.upgradeElement(el);
          }
        };
        const els = !!componentDef.mdlEl.forEach ? componentDef.mdlEl : [componentDef.mdlEl];
        els.forEach(upgradeEl);
      }
    }
  });
  var extraProps = componentDef.proto;
  if (extraProps) {
    for (var propName in extraProps) {
      if (extraProps.hasOwnProperty(propName)) {
        Object.defineProperty(componentProto, propName, extraProps[propName]);
      }
    }
  }
  document.registerElement(componentName, {prototype: componentProto});
};
