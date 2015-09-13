export function defineComponent(componentName, componentDef) {
  var componentProto = Object.create(HTMLElement.prototype, {
    createdCallback: {
      value: function() {
        componentDef.createShadowDOM.call(this);
        var shadowRoot = this.shadowRoot,
            upgradeEl = function(mdlEl) {
              var el = shadowRoot.querySelector(mdlEl);
              if (el) {
                window.componentHandler.upgradeElement(el);
              }
            };
        if (componentDef.mdlEl.forEach) {
          componentDef.mdlEl.forEach(upgradeEl);
        } else {
          upgradeEl(componentDef.mdlEl);
        }
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
