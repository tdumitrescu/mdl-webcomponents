export function defineComponent(componentName, componentDef) {
  var componentProto = Object.create(HTMLElement.prototype, {
    createdCallback: {
      value: function() {
        componentDef.createShadowDOM.call(this);
        window.componentHandler.upgradeElement(this.shadowRoot.querySelector(componentDef.mdlEl));
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
