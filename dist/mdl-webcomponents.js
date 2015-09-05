;(function() {
"use strict";

/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * A component handler interface using the revealing module design pattern.
 * More details on this design pattern here:
 * https://github.com/jasonmayes/mdl-component-design-pattern
 *
 * @author Jason Mayes.
 */
/* exported componentHandler */
window.componentHandler = (function() {
  'use strict';

  /** @type {!Array<componentHandler.ComponentConfig>} */
  var registeredComponents_ = [];

  /** @type {!Array<componentHandler.Component>} */
  var createdComponents_ = [];

  var downgradeMethod_ = 'mdlDowngrade_';
  var componentConfigProperty_ = 'mdlComponentConfigInternal_';

  /**
   * Searches registered components for a class we are interested in using.
   * Optionally replaces a match with passed object if specified.
   *
   * @param {String} name The name of a class we want to use.
   * @param {componentHandler.ComponentConfig=} optReplace Optional object to replace match with.
   * @return {!Object|Boolean}
   * @private
   */
  function findRegisteredClass_(name, optReplace) {
    for (var i = 0; i < registeredComponents_.length; i++) {
      if (registeredComponents_[i].className === name) {
        if (optReplace !== undefined) {
          registeredComponents_[i] = optReplace;
        }
        return registeredComponents_[i];
      }
    }
    return false;
  }

  /**
   * Returns an array of the classNames of the upgraded classes on the element.
   *
   * @param {!HTMLElement} element The element to fetch data from.
   * @return {!Array<String>}
   * @private
   */
  function getUpgradedListOfElement_(element) {
    var dataUpgraded = element.getAttribute('data-upgraded');
    // Use `['']` as default value to conform the `,name,name...` style.
    return dataUpgraded === null ? [''] : dataUpgraded.split(',');
  }

  /**
   * Returns true if the given element has already been upgraded for the given
   * class.
   *
   * @param {!HTMLElement} element The element we want to check.
   * @param {String} jsClass The class to check for.
   * @returns {Boolean}
   * @private
   */
  function isElementUpgraded_(element, jsClass) {
    var upgradedList = getUpgradedListOfElement_(element);
    return upgradedList.indexOf(jsClass) !== -1;
  }

  /**
   * Searches existing DOM for elements of our component type and upgrades them
   * if they have not already been upgraded.
   *
   * @param {String=} optJsClass the programatic name of the element class we
   * need to create a new instance of.
   * @param {String=} optCssClass the name of the CSS class elements of this
   * type will have.
   */
  function upgradeDomInternal(optJsClass, optCssClass) {
    if (optJsClass === undefined && optCssClass === undefined) {
      for (var i = 0; i < registeredComponents_.length; i++) {
        upgradeDomInternal(registeredComponents_[i].className,
            registeredComponents_[i].cssClass);
      }
    } else {
      var jsClass = /** @type {String} */ (optJsClass);
      if (optCssClass === undefined) {
        var registeredClass = findRegisteredClass_(jsClass);
        if (registeredClass) {
          optCssClass = registeredClass.cssClass;
        }
      }

      var elements = document.querySelectorAll('.' + optCssClass);
      for (var n = 0; n < elements.length; n++) {
        upgradeElementInternal(elements[n], jsClass);
      }
    }
  }

  /**
   * Upgrades a specific element rather than all in the DOM.
   *
   * @param {!HTMLElement} element The element we wish to upgrade.
   * @param {String=} optJsClass Optional name of the class we want to upgrade
   * the element to.
   */
  function upgradeElementInternal(element, optJsClass) {
    // Verify argument type.
    if (!(typeof element === 'object' && element instanceof Element)) {
      throw new Error('Invalid argument provided to upgrade MDL element.');
    }
    var upgradedList = getUpgradedListOfElement_(element);
    var classesToUpgrade = [];
    // If jsClass is not provided scan the registered components to find the
    // ones matching the element's CSS classList.
    if (!optJsClass) {
      var classList = element.classList;
      registeredComponents_.forEach(function(component) {
        // Match CSS & Not to be upgraded & Not upgraded.
        if (classList.contains(component.cssClass) &&
            classesToUpgrade.indexOf(component) === -1 &&
            !isElementUpgraded_(element, component.className)) {
          classesToUpgrade.push(component);
        }
      });
    } else if (!isElementUpgraded_(element, optJsClass)) {
      classesToUpgrade.push(findRegisteredClass_(optJsClass));
    }

    // Upgrade the element for each classes.
    for (var i = 0, n = classesToUpgrade.length, registeredClass; i < n; i++) {
      registeredClass = classesToUpgrade[i];
      if (registeredClass) {
        // Mark element as upgraded.
        upgradedList.push(registeredClass.className);
        element.setAttribute('data-upgraded', upgradedList.join(','));
        var instance = new registeredClass.classConstructor(element);
        instance[componentConfigProperty_] = registeredClass;
        createdComponents_.push(instance);
        // Call any callbacks the user has registered with this component type.
        for (var j = 0, m = registeredClass.callbacks.length; j < m; j++) {
          registeredClass.callbacks[j](element);
        }

        if (registeredClass.widget) {
          // Assign per element instance for control over API
          element[registeredClass.className] = instance;
        }
      } else {
        throw new Error(
          'Unable to find a registered component for the given class.');
      }

      var ev = document.createEvent('Events');
      ev.initEvent('mdl-componentupgraded', true, true);
      element.dispatchEvent(ev);
    }
  }

  /**
   * Upgrades a specific list of elements rather than all in the DOM.
   *
   * @param {!HTMLElement|!Array<!HTMLElement>|!NodeList|!HTMLCollection} elements
   * The elements we wish to upgrade.
   */
  function upgradeElementsInternal(elements) {
    if (!Array.isArray(elements)) {
      if (typeof elements.item === 'function') {
        elements = Array.prototype.slice.call(/** @type {Array} */ (elements));
      } else {
        elements = [elements];
      }
    }
    for (var i = 0, n = elements.length, element; i < n; i++) {
      element = elements[i];
      if (element instanceof HTMLElement) {
        if (element.children.length > 0) {
          upgradeElementsInternal(element.children);
        }
        upgradeElementInternal(element);
      }
    }
  }

  /**
   * Registers a class for future use and attempts to upgrade existing DOM.
   *
   * @param {{constructor: !Function, classAsString: String, cssClass: String, widget: String}} config
   */
  function registerInternal(config) {
    var newConfig = /** @type {componentHandler.ComponentConfig} */ ({
      'classConstructor': config.constructor,
      'className': config.classAsString,
      'cssClass': config.cssClass,
      'widget': config.widget === undefined ? true : config.widget,
      'callbacks': []
    });

    registeredComponents_.forEach(function(item) {
      if (item.cssClass === newConfig.cssClass) {
        throw new Error('The provided cssClass has already been registered.');
      }
      if (item.className === newConfig.className) {
        throw new Error('The provided className has already been registered');
      }
    });

    if (config.constructor.prototype
        .hasOwnProperty(componentConfigProperty_)) {
      throw new Error(
          'MDL component classes must not have ' + componentConfigProperty_ +
          ' defined as a property.');
    }

    var found = findRegisteredClass_(config.classAsString, newConfig);

    if (!found) {
      registeredComponents_.push(newConfig);
    }
  }

  /**
   * Allows user to be alerted to any upgrades that are performed for a given
   * component type
   *
   * @param {String} jsClass The class name of the MDL component we wish
   * to hook into for any upgrades performed.
   * @param {function(!HTMLElement)} callback The function to call upon an
   * upgrade. This function should expect 1 parameter - the HTMLElement which
   * got upgraded.
   */
  function registerUpgradedCallbackInternal(jsClass, callback) {
    var regClass = findRegisteredClass_(jsClass);
    if (regClass) {
      regClass.callbacks.push(callback);
    }
  }

  /**
   * Upgrades all registered components found in the current DOM. This is
   * automatically called on window load.
   */
  function upgradeAllRegisteredInternal() {
    for (var n = 0; n < registeredComponents_.length; n++) {
      upgradeDomInternal(registeredComponents_[n].className);
    }
  }

  /**
   * Finds a created component by a given DOM node.
   *
   * @param {!Node} node
   * @return {*}
   */
  function findCreatedComponentByNodeInternal(node) {
    for (var n = 0; n < createdComponents_.length; n++) {
      var component = createdComponents_[n];
      if (component.element_ === node) {
        return component;
      }
    }
  }

  /**
   * Check the component for the downgrade method.
   * Execute if found.
   * Remove component from createdComponents list.
   *
   * @param {*} component
   */
  function deconstructComponentInternal(component) {
    if (component &&
        component[componentConfigProperty_]
          .classConstructor.prototype
          .hasOwnProperty(downgradeMethod_)) {
      component[downgradeMethod_]();
      var componentIndex = createdComponents_.indexOf(component);
      createdComponents_.splice(componentIndex, 1);

      var upgrades = component.element_.getAttribute('data-upgraded').split(',');
      var componentPlace = upgrades.indexOf(
          component[componentConfigProperty_].classAsString);
      upgrades.splice(componentPlace, 1);
      component.element_.setAttribute('data-upgraded', upgrades.join(','));

      var ev = document.createEvent('Events');
      ev.initEvent('mdl-componentdowngraded', true, true);
      component.element_.dispatchEvent(ev);
    }
  }

  /**
   * Downgrade either a given node, an array of nodes, or a NodeList.
   *
   * @param {!Node|!Array<!Node>|!NodeList} nodes
   */
  function downgradeNodesInternal(nodes) {
    var downgradeNode = function(node) {
      deconstructComponentInternal(findCreatedComponentByNodeInternal(node));
    };
    if (nodes instanceof Array || nodes instanceof NodeList) {
      for (var n = 0; n < nodes.length; n++) {
        downgradeNode(nodes[n]);
      }
    } else if (nodes instanceof Node) {
      downgradeNode(nodes);
    } else {
      throw new Error('Invalid argument provided to downgrade MDL nodes.');
    }
  }

  // Now return the functions that should be made public with their publicly
  // facing names...
  return {
    upgradeDom: upgradeDomInternal,
    upgradeElement: upgradeElementInternal,
    upgradeElements: upgradeElementsInternal,
    upgradeAllRegistered: upgradeAllRegisteredInternal,
    registerUpgradedCallback: registerUpgradedCallbackInternal,
    register: registerInternal,
    downgradeElements: downgradeNodesInternal
  };
})();

window.addEventListener('load', function() {
  'use strict';

  /**
   * Performs a "Cutting the mustard" test. If the browser supports the features
   * tested, adds a mdl-js class to the <html> element. It then upgrades all MDL
   * components requiring JavaScript.
   */
  if ('classList' in document.createElement('div') &&
      'querySelector' in document &&
      'addEventListener' in window && Array.prototype.forEach) {
    document.documentElement.classList.add('mdl-js');
    componentHandler.upgradeAllRegistered();
  } else {
    componentHandler.upgradeElement =
        componentHandler.register = function() {};
  }
});

/**
 * Describes the type of a registered component type managed by
 * componentHandler. Provided for benefit of the Closure compiler.
 *
 * @typedef {{
 *   constructor: !Function,
 *   className: String,
 *   cssClass: String,
 *   widget: String,
 *   callbacks: !Array<function(!HTMLElement)>
 * }}
 */
componentHandler.ComponentConfig;  // jshint ignore:line

/**
 * Created component (i.e., upgraded element) type as managed by
 * componentHandler. Provided for benefit of the Closure compiler.
 *
 * @typedef {{
 *   element_: !HTMLElement,
 *   className: String,
 *   classAsString: String,
 *   cssClass: String,
 *   widget: String
 * }}
 */
componentHandler.Component;  // jshint ignore:line

// Source: https://github.com/darius/requestAnimationFrame/blob/master/requestAnimationFrame.js
// Adapted from https://gist.github.com/paulirish/1579671 which derived from
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller.
// Fixes from Paul Irish, Tino Zijdel, Andrew Mao, Klemen Slavič, Darius Bacon
// MIT license
if (!Date.now) {
    Date.now = function () {
        return new Date().getTime();
    };
}
var vendors = [
    'webkit',
    'moz'
];
for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
    var vp = vendors[i];
    window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
}
if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
    var lastTime = 0;
    window.requestAnimationFrame = function (callback) {
        var now = Date.now();
        var nextTime = Math.max(lastTime + 16, now);
        return setTimeout(function () {
            callback(lastTime = nextTime);
        }, nextTime - now);
    };
    window.cancelAnimationFrame = clearTimeout;
}
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
   * Class constructor for Button MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @param {HTMLElement} element The element that will be upgraded.
   */
var MaterialButton = function MaterialButton(element) {
    this.element_ = element;
    // Initialize instance.
    this.init();
};
window.MaterialButton = MaterialButton;
/**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {String | Number}
   * @private
   */
MaterialButton.prototype.Constant_ = {};
/**
   * Store strings for class names defined by this component that are used in
   * JavaScript. This allows us to simply change it in one place should we
   * decide to modify at a later date.
   *
   * @enum {String}
   * @private
   */
MaterialButton.prototype.CssClasses_ = {
    RIPPLE_EFFECT: 'mdl-js-ripple-effect',
    RIPPLE_CONTAINER: 'mdl-button__ripple-container',
    RIPPLE: 'mdl-ripple'
};
/**
   * Handle blur of element.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialButton.prototype.blurHandler_ = function (event) {
    if (event) {
        this.element_.blur();
    }
};
// Public methods.
/**
   * Disable button.
   *
   * @public
   */
MaterialButton.prototype.disable = function () {
    this.element_.disabled = true;
};
/**
   * Enable button.
   *
   * @public
   */
MaterialButton.prototype.enable = function () {
    this.element_.disabled = false;
};
/**
   * Initialize element.
   */
MaterialButton.prototype.init = function () {
    if (this.element_) {
        if (this.element_.classList.contains(this.CssClasses_.RIPPLE_EFFECT)) {
            var rippleContainer = document.createElement('span');
            rippleContainer.classList.add(this.CssClasses_.RIPPLE_CONTAINER);
            this.rippleElement_ = document.createElement('span');
            this.rippleElement_.classList.add(this.CssClasses_.RIPPLE);
            rippleContainer.appendChild(this.rippleElement_);
            this.boundRippleBlurHandler = this.blurHandler_.bind(this);
            this.rippleElement_.addEventListener('mouseup', this.boundRippleBlurHandler);
            this.element_.appendChild(rippleContainer);
        }
        this.boundButtonBlurHandler = this.blurHandler_.bind(this);
        this.element_.addEventListener('mouseup', this.boundButtonBlurHandler);
        this.element_.addEventListener('mouseleave', this.boundButtonBlurHandler);
    }
};
/**
   * Downgrade the element.
   *
   * @private
   */
MaterialButton.prototype.mdlDowngrade_ = function () {
    if (this.rippleElement_) {
        this.rippleElement_.removeEventListener('mouseup', this.boundRippleBlurHandler);
    }
    this.element_.removeEventListener('mouseup', this.boundButtonBlurHandler);
    this.element_.removeEventListener('mouseleave', this.boundButtonBlurHandler);
};
// The component registers itself. It can assume componentHandler is available
// in the global scope.
componentHandler.register({
    constructor: MaterialButton,
    classAsString: 'MaterialButton',
    cssClass: 'mdl-js-button',
    widget: true
});
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
   * Class constructor for Checkbox MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @param {HTMLElement} element The element that will be upgraded.
   */
var MaterialCheckbox = function MaterialCheckbox(element) {
    this.element_ = element;
    // Initialize instance.
    this.init();
};
window.MaterialCheckbox = MaterialCheckbox;
/**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {String | Number}
   * @private
   */
MaterialCheckbox.prototype.Constant_ = { TINY_TIMEOUT: 0.001 };
/**
   * Store strings for class names defined by this component that are used in
   * JavaScript. This allows us to simply change it in one place should we
   * decide to modify at a later date.
   *
   * @enum {String}
   * @private
   */
MaterialCheckbox.prototype.CssClasses_ = {
    INPUT: 'mdl-checkbox__input',
    BOX_OUTLINE: 'mdl-checkbox__box-outline',
    FOCUS_HELPER: 'mdl-checkbox__focus-helper',
    TICK_OUTLINE: 'mdl-checkbox__tick-outline',
    RIPPLE_EFFECT: 'mdl-js-ripple-effect',
    RIPPLE_IGNORE_EVENTS: 'mdl-js-ripple-effect--ignore-events',
    RIPPLE_CONTAINER: 'mdl-checkbox__ripple-container',
    RIPPLE_CENTER: 'mdl-ripple--center',
    RIPPLE: 'mdl-ripple',
    IS_FOCUSED: 'is-focused',
    IS_DISABLED: 'is-disabled',
    IS_CHECKED: 'is-checked',
    IS_UPGRADED: 'is-upgraded'
};
/**
   * Handle change of state.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialCheckbox.prototype.onChange_ = function (event) {
    this.updateClasses_();
};
/**
   * Handle focus of element.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialCheckbox.prototype.onFocus_ = function (event) {
    this.element_.classList.add(this.CssClasses_.IS_FOCUSED);
};
/**
   * Handle lost focus of element.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialCheckbox.prototype.onBlur_ = function (event) {
    this.element_.classList.remove(this.CssClasses_.IS_FOCUSED);
};
/**
   * Handle mouseup.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialCheckbox.prototype.onMouseUp_ = function (event) {
    this.blur_();
};
/**
   * Handle class updates.
   *
   * @private
   */
MaterialCheckbox.prototype.updateClasses_ = function () {
    this.checkDisabled();
    this.checkToggleState();
};
/**
   * Add blur.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialCheckbox.prototype.blur_ = function (event) {
    // TODO: figure out why there's a focus event being fired after our blur,
    // so that we can avoid this hack.
    window.setTimeout(function () {
        this.inputElement_.blur();
    }.bind(this), this.Constant_.TINY_TIMEOUT);
};
// Public methods.
/**
   * Check the inputs toggle state and update display.
   *
   * @public
   */
MaterialCheckbox.prototype.checkToggleState = function () {
    if (this.inputElement_.checked) {
        this.element_.classList.add(this.CssClasses_.IS_CHECKED);
    } else {
        this.element_.classList.remove(this.CssClasses_.IS_CHECKED);
    }
};
/**
   * Check the inputs disabled state and update display.
   *
   * @public
   */
MaterialCheckbox.prototype.checkDisabled = function () {
    if (this.inputElement_.disabled) {
        this.element_.classList.add(this.CssClasses_.IS_DISABLED);
    } else {
        this.element_.classList.remove(this.CssClasses_.IS_DISABLED);
    }
};
/**
   * Disable checkbox.
   *
   * @public
   */
MaterialCheckbox.prototype.disable = function () {
    this.inputElement_.disabled = true;
    this.updateClasses_();
};
/**
   * Enable checkbox.
   *
   * @public
   */
MaterialCheckbox.prototype.enable = function () {
    this.inputElement_.disabled = false;
    this.updateClasses_();
};
/**
   * Check checkbox.
   *
   * @public
   */
MaterialCheckbox.prototype.check = function () {
    this.inputElement_.checked = true;
    this.updateClasses_();
};
/**
   * Uncheck checkbox.
   *
   * @public
   */
MaterialCheckbox.prototype.uncheck = function () {
    this.inputElement_.checked = false;
    this.updateClasses_();
};
/**
   * Initialize element.
   */
MaterialCheckbox.prototype.init = function () {
    if (this.element_) {
        this.inputElement_ = this.element_.querySelector('.' + this.CssClasses_.INPUT);
        var boxOutline = document.createElement('span');
        boxOutline.classList.add(this.CssClasses_.BOX_OUTLINE);
        var tickContainer = document.createElement('span');
        tickContainer.classList.add(this.CssClasses_.FOCUS_HELPER);
        var tickOutline = document.createElement('span');
        tickOutline.classList.add(this.CssClasses_.TICK_OUTLINE);
        boxOutline.appendChild(tickOutline);
        this.element_.appendChild(tickContainer);
        this.element_.appendChild(boxOutline);
        if (this.element_.classList.contains(this.CssClasses_.RIPPLE_EFFECT)) {
            this.element_.classList.add(this.CssClasses_.RIPPLE_IGNORE_EVENTS);
            this.rippleContainerElement_ = document.createElement('span');
            this.rippleContainerElement_.classList.add(this.CssClasses_.RIPPLE_CONTAINER);
            this.rippleContainerElement_.classList.add(this.CssClasses_.RIPPLE_EFFECT);
            this.rippleContainerElement_.classList.add(this.CssClasses_.RIPPLE_CENTER);
            this.boundRippleMouseUp = this.onMouseUp_.bind(this);
            this.rippleContainerElement_.addEventListener('mouseup', this.boundRippleMouseUp);
            var ripple = document.createElement('span');
            ripple.classList.add(this.CssClasses_.RIPPLE);
            this.rippleContainerElement_.appendChild(ripple);
            this.element_.appendChild(this.rippleContainerElement_);
        }
        this.boundInputOnChange = this.onChange_.bind(this);
        this.boundInputOnFocus = this.onFocus_.bind(this);
        this.boundInputOnBlur = this.onBlur_.bind(this);
        this.boundElementMouseUp = this.onMouseUp_.bind(this);
        this.inputElement_.addEventListener('change', this.boundInputOnChange);
        this.inputElement_.addEventListener('focus', this.boundInputOnFocus);
        this.inputElement_.addEventListener('blur', this.boundInputOnBlur);
        this.element_.addEventListener('mouseup', this.boundElementMouseUp);
        this.updateClasses_();
        this.element_.classList.add(this.CssClasses_.IS_UPGRADED);
    }
};
/**
   * Downgrade the component.
   *
   * @private
   */
MaterialCheckbox.prototype.mdlDowngrade_ = function () {
    if (this.rippleContainerElement_) {
        this.rippleContainerElement_.removeEventListener('mouseup', this.boundRippleMouseUp);
    }
    this.inputElement_.removeEventListener('change', this.boundInputOnChange);
    this.inputElement_.removeEventListener('focus', this.boundInputOnFocus);
    this.inputElement_.removeEventListener('blur', this.boundInputOnBlur);
    this.element_.removeEventListener('mouseup', this.boundElementMouseUp);
};
// The component registers itself. It can assume componentHandler is available
// in the global scope.
componentHandler.register({
    constructor: MaterialCheckbox,
    classAsString: 'MaterialCheckbox',
    cssClass: 'mdl-js-checkbox',
    widget: true
});
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
   * Class constructor for icon toggle MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @param {HTMLElement} element The element that will be upgraded.
   */
var MaterialIconToggle = function MaterialIconToggle(element) {
    this.element_ = element;
    // Initialize instance.
    this.init();
};
window.MaterialIconToggle = MaterialIconToggle;
/**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {String | Number}
   * @private
   */
MaterialIconToggle.prototype.Constant_ = { TINY_TIMEOUT: 0.001 };
/**
   * Store strings for class names defined by this component that are used in
   * JavaScript. This allows us to simply change it in one place should we
   * decide to modify at a later date.
   *
   * @enum {String}
   * @private
   */
MaterialIconToggle.prototype.CssClasses_ = {
    INPUT: 'mdl-icon-toggle__input',
    JS_RIPPLE_EFFECT: 'mdl-js-ripple-effect',
    RIPPLE_IGNORE_EVENTS: 'mdl-js-ripple-effect--ignore-events',
    RIPPLE_CONTAINER: 'mdl-icon-toggle__ripple-container',
    RIPPLE_CENTER: 'mdl-ripple--center',
    RIPPLE: 'mdl-ripple',
    IS_FOCUSED: 'is-focused',
    IS_DISABLED: 'is-disabled',
    IS_CHECKED: 'is-checked'
};
/**
   * Handle change of state.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialIconToggle.prototype.onChange_ = function (event) {
    this.updateClasses_();
};
/**
   * Handle focus of element.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialIconToggle.prototype.onFocus_ = function (event) {
    this.element_.classList.add(this.CssClasses_.IS_FOCUSED);
};
/**
   * Handle lost focus of element.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialIconToggle.prototype.onBlur_ = function (event) {
    this.element_.classList.remove(this.CssClasses_.IS_FOCUSED);
};
/**
   * Handle mouseup.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialIconToggle.prototype.onMouseUp_ = function (event) {
    this.blur_();
};
/**
   * Handle class updates.
   *
   * @private
   */
MaterialIconToggle.prototype.updateClasses_ = function () {
    this.checkDisabled();
    this.checkToggleState();
};
/**
   * Add blur.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialIconToggle.prototype.blur_ = function (event) {
    // TODO: figure out why there's a focus event being fired after our blur,
    // so that we can avoid this hack.
    window.setTimeout(function () {
        this.inputElement_.blur();
    }.bind(this), this.Constant_.TINY_TIMEOUT);
};
// Public methods.
/**
   * Check the inputs toggle state and update display.
   *
   * @public
   */
MaterialIconToggle.prototype.checkToggleState = function () {
    if (this.inputElement_.checked) {
        this.element_.classList.add(this.CssClasses_.IS_CHECKED);
    } else {
        this.element_.classList.remove(this.CssClasses_.IS_CHECKED);
    }
};
/**
   * Check the inputs disabled state and update display.
   *
   * @public
   */
MaterialIconToggle.prototype.checkDisabled = function () {
    if (this.inputElement_.disabled) {
        this.element_.classList.add(this.CssClasses_.IS_DISABLED);
    } else {
        this.element_.classList.remove(this.CssClasses_.IS_DISABLED);
    }
};
/**
   * Disable icon toggle.
   *
   * @public
   */
MaterialIconToggle.prototype.disable = function () {
    this.inputElement_.disabled = true;
    this.updateClasses_();
};
/**
   * Enable icon toggle.
   *
   * @public
   */
MaterialIconToggle.prototype.enable = function () {
    this.inputElement_.disabled = false;
    this.updateClasses_();
};
/**
   * Check icon toggle.
   *
   * @public
   */
MaterialIconToggle.prototype.check = function () {
    this.inputElement_.checked = true;
    this.updateClasses_();
};
/**
   * Uncheck icon toggle.
   *
   * @public
   */
MaterialIconToggle.prototype.uncheck = function () {
    this.inputElement_.checked = false;
    this.updateClasses_();
};
/**
   * Initialize element.
   */
MaterialIconToggle.prototype.init = function () {
    if (this.element_) {
        this.inputElement_ = this.element_.querySelector('.' + this.CssClasses_.INPUT);
        if (this.element_.classList.contains(this.CssClasses_.JS_RIPPLE_EFFECT)) {
            this.element_.classList.add(this.CssClasses_.RIPPLE_IGNORE_EVENTS);
            this.rippleContainerElement_ = document.createElement('span');
            this.rippleContainerElement_.classList.add(this.CssClasses_.RIPPLE_CONTAINER);
            this.rippleContainerElement_.classList.add(this.CssClasses_.JS_RIPPLE_EFFECT);
            this.rippleContainerElement_.classList.add(this.CssClasses_.RIPPLE_CENTER);
            this.boundRippleMouseUp = this.onMouseUp_.bind(this);
            this.rippleContainerElement_.addEventListener('mouseup', this.boundRippleMouseUp);
            var ripple = document.createElement('span');
            ripple.classList.add(this.CssClasses_.RIPPLE);
            this.rippleContainerElement_.appendChild(ripple);
            this.element_.appendChild(this.rippleContainerElement_);
        }
        this.boundInputOnChange = this.onChange_.bind(this);
        this.boundInputOnFocus = this.onFocus_.bind(this);
        this.boundInputOnBlur = this.onBlur_.bind(this);
        this.boundElementOnMouseUp = this.onMouseUp_.bind(this);
        this.inputElement_.addEventListener('change', this.boundInputOnChange);
        this.inputElement_.addEventListener('focus', this.boundInputOnFocus);
        this.inputElement_.addEventListener('blur', this.boundInputOnBlur);
        this.element_.addEventListener('mouseup', this.boundElementOnMouseUp);
        this.updateClasses_();
        this.element_.classList.add('is-upgraded');
    }
};
/**
   * Downgrade the component
   *
   * @private
   */
MaterialIconToggle.prototype.mdlDowngrade_ = function () {
    if (this.rippleContainerElement_) {
        this.rippleContainerElement_.removeEventListener('mouseup', this.boundRippleMouseUp);
    }
    this.inputElement_.removeEventListener('change', this.boundInputOnChange);
    this.inputElement_.removeEventListener('focus', this.boundInputOnFocus);
    this.inputElement_.removeEventListener('blur', this.boundInputOnBlur);
    this.element_.removeEventListener('mouseup', this.boundElementOnMouseUp);
};
// The component registers itself. It can assume componentHandler is available
// in the global scope.
componentHandler.register({
    constructor: MaterialIconToggle,
    classAsString: 'MaterialIconToggle',
    cssClass: 'mdl-js-icon-toggle',
    widget: true
});
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
   * Class constructor for dropdown MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @param {HTMLElement} element The element that will be upgraded.
   */
var MaterialMenu = function MaterialMenu(element) {
    this.element_ = element;
    // Initialize instance.
    this.init();
};
window.MaterialMenu = MaterialMenu;
/**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {String | Number}
   * @private
   */
MaterialMenu.prototype.Constant_ = {
    // Total duration of the menu animation.
    TRANSITION_DURATION_SECONDS: 0.3,
    // The fraction of the total duration we want to use for menu item animations.
    TRANSITION_DURATION_FRACTION: 0.8,
    // How long the menu stays open after choosing an option (so the user can see
    // the ripple).
    CLOSE_TIMEOUT: 150
};
/**
   * Keycodes, for code readability.
   *
   * @enum {Number}
   * @private
   */
MaterialMenu.prototype.Keycodes_ = {
    ENTER: 13,
    ESCAPE: 27,
    SPACE: 32,
    UP_ARROW: 38,
    DOWN_ARROW: 40
};
/**
   * Store strings for class names defined by this component that are used in
   * JavaScript. This allows us to simply change it in one place should we
   * decide to modify at a later date.
   *
   * @enum {String}
   * @private
   */
MaterialMenu.prototype.CssClasses_ = {
    CONTAINER: 'mdl-menu__container',
    OUTLINE: 'mdl-menu__outline',
    ITEM: 'mdl-menu__item',
    ITEM_RIPPLE_CONTAINER: 'mdl-menu__item-ripple-container',
    RIPPLE_EFFECT: 'mdl-js-ripple-effect',
    RIPPLE_IGNORE_EVENTS: 'mdl-js-ripple-effect--ignore-events',
    RIPPLE: 'mdl-ripple',
    // Statuses
    IS_UPGRADED: 'is-upgraded',
    IS_VISIBLE: 'is-visible',
    IS_ANIMATING: 'is-animating',
    // Alignment options
    BOTTOM_LEFT: 'mdl-menu--bottom-left',
    // This is the default.
    BOTTOM_RIGHT: 'mdl-menu--bottom-right',
    TOP_LEFT: 'mdl-menu--top-left',
    TOP_RIGHT: 'mdl-menu--top-right',
    UNALIGNED: 'mdl-menu--unaligned'
};
/**
   * Initialize element.
   */
MaterialMenu.prototype.init = function () {
    if (this.element_) {
        // Create container for the menu.
        var container = document.createElement('div');
        container.classList.add(this.CssClasses_.CONTAINER);
        this.element_.parentElement.insertBefore(container, this.element_);
        this.element_.parentElement.removeChild(this.element_);
        container.appendChild(this.element_);
        this.container_ = container;
        // Create outline for the menu (shadow and background).
        var outline = document.createElement('div');
        outline.classList.add(this.CssClasses_.OUTLINE);
        this.outline_ = outline;
        container.insertBefore(outline, this.element_);
        // Find the "for" element and bind events to it.
        var forElId = this.element_.getAttribute('for');
        var forEl = null;
        if (forElId) {
            forEl = document.getElementById(forElId);
            if (forEl) {
                this.forElement_ = forEl;
                forEl.addEventListener('click', this.handleForClick_.bind(this));
                forEl.addEventListener('keydown', this.handleForKeyboardEvent_.bind(this));
            }
        }
        var items = this.element_.querySelectorAll('.' + this.CssClasses_.ITEM);
        this.boundItemKeydown = this.handleItemKeyboardEvent_.bind(this);
        this.boundItemClick = this.handleItemClick_.bind(this);
        for (var i = 0; i < items.length; i++) {
            // Add a listener to each menu item.
            items[i].addEventListener('click', this.boundItemClick);
            // Add a tab index to each menu item.
            items[i].tabIndex = '-1';
            // Add a keyboard listener to each menu item.
            items[i].addEventListener('keydown', this.boundItemKeydown);
        }
        // Add ripple classes to each item, if the user has enabled ripples.
        if (this.element_.classList.contains(this.CssClasses_.RIPPLE_EFFECT)) {
            this.element_.classList.add(this.CssClasses_.RIPPLE_IGNORE_EVENTS);
            for (i = 0; i < items.length; i++) {
                var item = items[i];
                var rippleContainer = document.createElement('span');
                rippleContainer.classList.add(this.CssClasses_.ITEM_RIPPLE_CONTAINER);
                var ripple = document.createElement('span');
                ripple.classList.add(this.CssClasses_.RIPPLE);
                rippleContainer.appendChild(ripple);
                item.appendChild(rippleContainer);
                item.classList.add(this.CssClasses_.RIPPLE_EFFECT);
            }
        }
        // Copy alignment classes to the container, so the outline can use them.
        if (this.element_.classList.contains(this.CssClasses_.BOTTOM_LEFT)) {
            this.outline_.classList.add(this.CssClasses_.BOTTOM_LEFT);
        }
        if (this.element_.classList.contains(this.CssClasses_.BOTTOM_RIGHT)) {
            this.outline_.classList.add(this.CssClasses_.BOTTOM_RIGHT);
        }
        if (this.element_.classList.contains(this.CssClasses_.TOP_LEFT)) {
            this.outline_.classList.add(this.CssClasses_.TOP_LEFT);
        }
        if (this.element_.classList.contains(this.CssClasses_.TOP_RIGHT)) {
            this.outline_.classList.add(this.CssClasses_.TOP_RIGHT);
        }
        if (this.element_.classList.contains(this.CssClasses_.UNALIGNED)) {
            this.outline_.classList.add(this.CssClasses_.UNALIGNED);
        }
        container.classList.add(this.CssClasses_.IS_UPGRADED);
    }
};
/**
   * Handles a click on the "for" element, by positioning the menu and then
   * toggling it.
   *
   * @param {Event} evt The event that fired.
   * @private
   */
MaterialMenu.prototype.handleForClick_ = function (evt) {
    if (this.element_ && this.forElement_) {
        var rect = this.forElement_.getBoundingClientRect();
        var forRect = this.forElement_.parentElement.getBoundingClientRect();
        if (this.element_.classList.contains(this.CssClasses_.UNALIGNED)) {
        } else if (this.element_.classList.contains(this.CssClasses_.BOTTOM_RIGHT)) {
            // Position below the "for" element, aligned to its right.
            this.container_.style.right = forRect.right - rect.right + 'px';
            this.container_.style.top = this.forElement_.offsetTop + this.forElement_.offsetHeight + 'px';
        } else if (this.element_.classList.contains(this.CssClasses_.TOP_LEFT)) {
            // Position above the "for" element, aligned to its left.
            this.container_.style.left = this.forElement_.offsetLeft + 'px';
            this.container_.style.bottom = forRect.bottom - rect.top + 'px';
        } else if (this.element_.classList.contains(this.CssClasses_.TOP_RIGHT)) {
            // Position above the "for" element, aligned to its right.
            this.container_.style.right = forRect.right - rect.right + 'px';
            this.container_.style.bottom = forRect.bottom - rect.top + 'px';
        } else {
            // Default: position below the "for" element, aligned to its left.
            this.container_.style.left = this.forElement_.offsetLeft + 'px';
            this.container_.style.top = this.forElement_.offsetTop + this.forElement_.offsetHeight + 'px';
        }
    }
    this.toggle(evt);
};
/**
   * Handles a keyboard event on the "for" element.
   *
   * @param {Event} evt The event that fired.
   * @private
   */
MaterialMenu.prototype.handleForKeyboardEvent_ = function (evt) {
    if (this.element_ && this.container_ && this.forElement_) {
        var items = this.element_.querySelectorAll('.' + this.CssClasses_.ITEM + ':not([disabled])');
        if (items && items.length > 0 && this.container_.classList.contains(this.CssClasses_.IS_VISIBLE)) {
            if (evt.keyCode === this.Keycodes_.UP_ARROW) {
                evt.preventDefault();
                items[items.length - 1].focus();
            } else if (evt.keyCode === this.Keycodes_.DOWN_ARROW) {
                evt.preventDefault();
                items[0].focus();
            }
        }
    }
};
/**
   * Handles a keyboard event on an item.
   *
   * @param {Event} evt The event that fired.
   * @private
   */
MaterialMenu.prototype.handleItemKeyboardEvent_ = function (evt) {
    if (this.element_ && this.container_) {
        var items = this.element_.querySelectorAll('.' + this.CssClasses_.ITEM + ':not([disabled])');
        if (items && items.length > 0 && this.container_.classList.contains(this.CssClasses_.IS_VISIBLE)) {
            var currentIndex = Array.prototype.slice.call(items).indexOf(evt.target);
            if (evt.keyCode === this.Keycodes_.UP_ARROW) {
                evt.preventDefault();
                if (currentIndex > 0) {
                    items[currentIndex - 1].focus();
                } else {
                    items[items.length - 1].focus();
                }
            } else if (evt.keyCode === this.Keycodes_.DOWN_ARROW) {
                evt.preventDefault();
                if (items.length > currentIndex + 1) {
                    items[currentIndex + 1].focus();
                } else {
                    items[0].focus();
                }
            } else if (evt.keyCode === this.Keycodes_.SPACE || evt.keyCode === this.Keycodes_.ENTER) {
                evt.preventDefault();
                // Send mousedown and mouseup to trigger ripple.
                var e = new MouseEvent('mousedown');
                evt.target.dispatchEvent(e);
                e = new MouseEvent('mouseup');
                evt.target.dispatchEvent(e);
                // Send click.
                evt.target.click();
            } else if (evt.keyCode === this.Keycodes_.ESCAPE) {
                evt.preventDefault();
                this.hide();
            }
        }
    }
};
/**
   * Handles a click event on an item.
   *
   * @param {Event} evt The event that fired.
   * @private
   */
MaterialMenu.prototype.handleItemClick_ = function (evt) {
    if (evt.target.getAttribute('disabled') !== null) {
        evt.stopPropagation();
    } else {
        // Wait some time before closing menu, so the user can see the ripple.
        this.closing_ = true;
        window.setTimeout(function (evt) {
            this.hide();
            this.closing_ = false;
        }.bind(this), this.Constant_.CLOSE_TIMEOUT);
    }
};
/**
   * Calculates the initial clip (for opening the menu) or final clip (for closing
   * it), and applies it. This allows us to animate from or to the correct point,
   * that is, the point it's aligned to in the "for" element.
   *
   * @param {Number} height Height of the clip rectangle
   * @param {Number} width Width of the clip rectangle
   * @private
   */
MaterialMenu.prototype.applyClip_ = function (height, width) {
    if (this.element_.classList.contains(this.CssClasses_.UNALIGNED)) {
        // Do not clip.
        this.element_.style.clip = null;
    } else if (this.element_.classList.contains(this.CssClasses_.BOTTOM_RIGHT)) {
        // Clip to the top right corner of the menu.
        this.element_.style.clip = 'rect(0 ' + width + 'px ' + '0 ' + width + 'px)';
    } else if (this.element_.classList.contains(this.CssClasses_.TOP_LEFT)) {
        // Clip to the bottom left corner of the menu.
        this.element_.style.clip = 'rect(' + height + 'px 0 ' + height + 'px 0)';
    } else if (this.element_.classList.contains(this.CssClasses_.TOP_RIGHT)) {
        // Clip to the bottom right corner of the menu.
        this.element_.style.clip = 'rect(' + height + 'px ' + width + 'px ' + height + 'px ' + width + 'px)';
    } else {
        // Default: do not clip (same as clipping to the top left corner).
        this.element_.style.clip = null;
    }
};
/**
   * Adds an event listener to clean up after the animation ends.
   *
   * @private
   */
MaterialMenu.prototype.addAnimationEndListener_ = function () {
    var cleanup = function () {
        this.element_.removeEventListener('transitionend', cleanup);
        this.element_.removeEventListener('webkitTransitionEnd', cleanup);
        this.element_.classList.remove(this.CssClasses_.IS_ANIMATING);
    }.bind(this);
    // Remove animation class once the transition is done.
    this.element_.addEventListener('transitionend', cleanup);
    this.element_.addEventListener('webkitTransitionEnd', cleanup);
};
/**
   * Displays the menu.
   *
   * @public
   */
MaterialMenu.prototype.show = function (evt) {
    if (this.element_ && this.container_ && this.outline_) {
        // Measure the inner element.
        var height = this.element_.getBoundingClientRect().height;
        var width = this.element_.getBoundingClientRect().width;
        // Apply the inner element's size to the container and outline.
        this.container_.style.width = width + 'px';
        this.container_.style.height = height + 'px';
        this.outline_.style.width = width + 'px';
        this.outline_.style.height = height + 'px';
        var transitionDuration = this.Constant_.TRANSITION_DURATION_SECONDS * this.Constant_.TRANSITION_DURATION_FRACTION;
        // Calculate transition delays for individual menu items, so that they fade
        // in one at a time.
        var items = this.element_.querySelectorAll('.' + this.CssClasses_.ITEM);
        for (var i = 0; i < items.length; i++) {
            var itemDelay = null;
            if (this.element_.classList.contains(this.CssClasses_.TOP_LEFT) || this.element_.classList.contains(this.CssClasses_.TOP_RIGHT)) {
                itemDelay = (height - items[i].offsetTop - items[i].offsetHeight) / height * transitionDuration + 's';
            } else {
                itemDelay = items[i].offsetTop / height * transitionDuration + 's';
            }
            items[i].style.transitionDelay = itemDelay;
        }
        // Apply the initial clip to the text before we start animating.
        this.applyClip_(height, width);
        // Wait for the next frame, turn on animation, and apply the final clip.
        // Also make it visible. This triggers the transitions.
        window.requestAnimationFrame(function () {
            this.element_.classList.add(this.CssClasses_.IS_ANIMATING);
            this.element_.style.clip = 'rect(0 ' + width + 'px ' + height + 'px 0)';
            this.container_.classList.add(this.CssClasses_.IS_VISIBLE);
        }.bind(this));
        // Clean up after the animation is complete.
        this.addAnimationEndListener_();
        // Add a click listener to the document, to close the menu.
        var callback = function (e) {
            // Check to see if the document is processing the same event that
            // displayed the menu in the first place. If so, do nothing.
            // Also check to see if the menu is in the process of closing itself, and
            // do nothing in that case.
            if (e !== evt && !this.closing_) {
                document.removeEventListener('click', callback);
                this.hide();
            }
        }.bind(this);
        document.addEventListener('click', callback);
    }
};
/**
   * Hides the menu.
   *
   * @public
   */
MaterialMenu.prototype.hide = function () {
    if (this.element_ && this.container_ && this.outline_) {
        var items = this.element_.querySelectorAll('.' + this.CssClasses_.ITEM);
        // Remove all transition delays; menu items fade out concurrently.
        for (var i = 0; i < items.length; i++) {
            items[i].style.transitionDelay = null;
        }
        // Measure the inner element.
        var height = this.element_.getBoundingClientRect().height;
        var width = this.element_.getBoundingClientRect().width;
        // Turn on animation, and apply the final clip. Also make invisible.
        // This triggers the transitions.
        this.element_.classList.add(this.CssClasses_.IS_ANIMATING);
        this.applyClip_(height, width);
        this.container_.classList.remove(this.CssClasses_.IS_VISIBLE);
        // Clean up after the animation is complete.
        this.addAnimationEndListener_();
    }
};
/**
   * Displays or hides the menu, depending on current state.
   *
   * @public
   */
MaterialMenu.prototype.toggle = function (evt) {
    if (this.container_.classList.contains(this.CssClasses_.IS_VISIBLE)) {
        this.hide();
    } else {
        this.show(evt);
    }
};
/**
   * Downgrade the component.
   *
   * @private
   */
MaterialMenu.prototype.mdlDowngrade_ = function () {
    var items = this.element_.querySelectorAll('.' + this.CssClasses_.ITEM);
    for (var i = 0; i < items.length; i++) {
        items[i].removeEventListener('click', this.boundItemClick);
        items[i].removeEventListener('keydown', this.boundItemKeydown);
    }
};
// The component registers itself. It can assume componentHandler is available
// in the global scope.
componentHandler.register({
    constructor: MaterialMenu,
    classAsString: 'MaterialMenu',
    cssClass: 'mdl-js-menu',
    widget: true
});
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
   * Class constructor for Progress MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @param {HTMLElement} element The element that will be upgraded.
   */
var MaterialProgress = function MaterialProgress(element) {
    this.element_ = element;
    // Initialize instance.
    this.init();
};
window.MaterialProgress = MaterialProgress;
/**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {String | Number}
   * @private
   */
MaterialProgress.prototype.Constant_ = {};
/**
   * Store strings for class names defined by this component that are used in
   * JavaScript. This allows us to simply change it in one place should we
   * decide to modify at a later date.
   *
   * @enum {String}
   * @private
   */
MaterialProgress.prototype.CssClasses_ = { INDETERMINATE_CLASS: 'mdl-progress__indeterminate' };
/**
   * Set the current progress of the progressbar.
   *
   * @param {Number} p Percentage of the progress (0-100)
   * @public
   */
MaterialProgress.prototype.setProgress = function (p) {
    if (this.element_.classList.contains(this.CssClasses_.INDETERMINATE_CLASS)) {
        return;
    }
    this.progressbar_.style.width = p + '%';
};
/**
   * Set the current progress of the buffer.
   *
   * @param {Number} p Percentage of the buffer (0-100)
   * @public
   */
MaterialProgress.prototype.setBuffer = function (p) {
    this.bufferbar_.style.width = p + '%';
    this.auxbar_.style.width = 100 - p + '%';
};
/**
   * Initialize element.
   */
MaterialProgress.prototype.init = function () {
    if (this.element_) {
        var el = document.createElement('div');
        el.className = 'progressbar bar bar1';
        this.element_.appendChild(el);
        this.progressbar_ = el;
        el = document.createElement('div');
        el.className = 'bufferbar bar bar2';
        this.element_.appendChild(el);
        this.bufferbar_ = el;
        el = document.createElement('div');
        el.className = 'auxbar bar bar3';
        this.element_.appendChild(el);
        this.auxbar_ = el;
        this.progressbar_.style.width = '0%';
        this.bufferbar_.style.width = '100%';
        this.auxbar_.style.width = '0%';
        this.element_.classList.add('is-upgraded');
    }
};
/**
   * Downgrade the component
   *
   * @private
   */
MaterialProgress.prototype.mdlDowngrade_ = function () {
    while (this.element_.firstChild) {
        this.element_.removeChild(this.element_.firstChild);
    }
};
// The component registers itself. It can assume componentHandler is available
// in the global scope.
componentHandler.register({
    constructor: MaterialProgress,
    classAsString: 'MaterialProgress',
    cssClass: 'mdl-js-progress',
    widget: true
});
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
   * Class constructor for Radio MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @param {HTMLElement} element The element that will be upgraded.
   */
var MaterialRadio = function MaterialRadio(element) {
    this.element_ = element;
    // Initialize instance.
    this.init();
};
window.MaterialRadio = MaterialRadio;
/**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {String | Number}
   * @private
   */
MaterialRadio.prototype.Constant_ = { TINY_TIMEOUT: 0.001 };
/**
   * Store strings for class names defined by this component that are used in
   * JavaScript. This allows us to simply change it in one place should we
   * decide to modify at a later date.
   *
   * @enum {String}
   * @private
   */
MaterialRadio.prototype.CssClasses_ = {
    IS_FOCUSED: 'is-focused',
    IS_DISABLED: 'is-disabled',
    IS_CHECKED: 'is-checked',
    IS_UPGRADED: 'is-upgraded',
    JS_RADIO: 'mdl-js-radio',
    RADIO_BTN: 'mdl-radio__button',
    RADIO_OUTER_CIRCLE: 'mdl-radio__outer-circle',
    RADIO_INNER_CIRCLE: 'mdl-radio__inner-circle',
    RIPPLE_EFFECT: 'mdl-js-ripple-effect',
    RIPPLE_IGNORE_EVENTS: 'mdl-js-ripple-effect--ignore-events',
    RIPPLE_CONTAINER: 'mdl-radio__ripple-container',
    RIPPLE_CENTER: 'mdl-ripple--center',
    RIPPLE: 'mdl-ripple'
};
/**
   * Handle change of state.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialRadio.prototype.onChange_ = function (event) {
    // Since other radio buttons don't get change events, we need to look for
    // them to update their classes.
    var radios = document.getElementsByClassName(this.CssClasses_.JS_RADIO);
    for (var i = 0; i < radios.length; i++) {
        var button = radios[i].querySelector('.' + this.CssClasses_.RADIO_BTN);
        // Different name == different group, so no point updating those.
        if (button.getAttribute('name') === this.btnElement_.getAttribute('name')) {
            radios[i].MaterialRadio.updateClasses_();
        }
    }
};
/**
   * Handle focus.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialRadio.prototype.onFocus_ = function (event) {
    this.element_.classList.add(this.CssClasses_.IS_FOCUSED);
};
/**
   * Handle lost focus.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialRadio.prototype.onBlur_ = function (event) {
    this.element_.classList.remove(this.CssClasses_.IS_FOCUSED);
};
/**
   * Handle mouseup.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialRadio.prototype.onMouseup_ = function (event) {
    this.blur_();
};
/**
   * Update classes.
   *
   * @private
   */
MaterialRadio.prototype.updateClasses_ = function () {
    this.checkDisabled();
    this.checkToggleState();
};
/**
   * Add blur.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialRadio.prototype.blur_ = function (event) {
    // TODO: figure out why there's a focus event being fired after our blur,
    // so that we can avoid this hack.
    window.setTimeout(function () {
        this.btnElement_.blur();
    }.bind(this), this.Constant_.TINY_TIMEOUT);
};
// Public methods.
/**
   * Check the components disabled state.
   *
   * @public
   */
MaterialRadio.prototype.checkDisabled = function () {
    if (this.btnElement_.disabled) {
        this.element_.classList.add(this.CssClasses_.IS_DISABLED);
    } else {
        this.element_.classList.remove(this.CssClasses_.IS_DISABLED);
    }
};
/**
   * Check the components toggled state.
   *
   * @public
   */
MaterialRadio.prototype.checkToggleState = function () {
    if (this.btnElement_.checked) {
        this.element_.classList.add(this.CssClasses_.IS_CHECKED);
    } else {
        this.element_.classList.remove(this.CssClasses_.IS_CHECKED);
    }
};
/**
   * Disable radio.
   *
   * @public
   */
MaterialRadio.prototype.disable = function () {
    this.btnElement_.disabled = true;
    this.updateClasses_();
};
/**
   * Enable radio.
   *
   * @public
   */
MaterialRadio.prototype.enable = function () {
    this.btnElement_.disabled = false;
    this.updateClasses_();
};
/**
   * Check radio.
   *
   * @public
   */
MaterialRadio.prototype.check = function () {
    this.btnElement_.checked = true;
    this.updateClasses_();
};
/**
   * Uncheck radio.
   *
   * @public
   */
MaterialRadio.prototype.uncheck = function () {
    this.btnElement_.checked = false;
    this.updateClasses_();
};
/**
   * Initialize element.
   */
MaterialRadio.prototype.init = function () {
    if (this.element_) {
        this.btnElement_ = this.element_.querySelector('.' + this.CssClasses_.RADIO_BTN);
        var outerCircle = document.createElement('span');
        outerCircle.classList.add(this.CssClasses_.RADIO_OUTER_CIRCLE);
        var innerCircle = document.createElement('span');
        innerCircle.classList.add(this.CssClasses_.RADIO_INNER_CIRCLE);
        this.element_.appendChild(outerCircle);
        this.element_.appendChild(innerCircle);
        var rippleContainer;
        if (this.element_.classList.contains(this.CssClasses_.RIPPLE_EFFECT)) {
            this.element_.classList.add(this.CssClasses_.RIPPLE_IGNORE_EVENTS);
            rippleContainer = document.createElement('span');
            rippleContainer.classList.add(this.CssClasses_.RIPPLE_CONTAINER);
            rippleContainer.classList.add(this.CssClasses_.RIPPLE_EFFECT);
            rippleContainer.classList.add(this.CssClasses_.RIPPLE_CENTER);
            rippleContainer.addEventListener('mouseup', this.onMouseup_.bind(this));
            var ripple = document.createElement('span');
            ripple.classList.add(this.CssClasses_.RIPPLE);
            rippleContainer.appendChild(ripple);
            this.element_.appendChild(rippleContainer);
        }
        this.btnElement_.addEventListener('change', this.onChange_.bind(this));
        this.btnElement_.addEventListener('focus', this.onFocus_.bind(this));
        this.btnElement_.addEventListener('blur', this.onBlur_.bind(this));
        this.element_.addEventListener('mouseup', this.onMouseup_.bind(this));
        this.updateClasses_();
        this.element_.classList.add(this.CssClasses_.IS_UPGRADED);
    }
};
// The component registers itself. It can assume componentHandler is available
// in the global scope.
componentHandler.register({
    constructor: MaterialRadio,
    classAsString: 'MaterialRadio',
    cssClass: 'mdl-js-radio',
    widget: true
});
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
   * Class constructor for Slider MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @param {HTMLElement} element The element that will be upgraded.
   */
var MaterialSlider = function MaterialSlider(element) {
    this.element_ = element;
    // Browser feature detection.
    this.isIE_ = window.navigator.msPointerEnabled;
    // Initialize instance.
    this.init();
};
window.MaterialSlider = MaterialSlider;
/**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {String | Number}
   * @private
   */
MaterialSlider.prototype.Constant_ = {};
/**
   * Store strings for class names defined by this component that are used in
   * JavaScript. This allows us to simply change it in one place should we
   * decide to modify at a later date.
   *
   * @enum {String}
   * @private
   */
MaterialSlider.prototype.CssClasses_ = {
    IE_CONTAINER: 'mdl-slider__ie-container',
    SLIDER_CONTAINER: 'mdl-slider__container',
    BACKGROUND_FLEX: 'mdl-slider__background-flex',
    BACKGROUND_LOWER: 'mdl-slider__background-lower',
    BACKGROUND_UPPER: 'mdl-slider__background-upper',
    IS_LOWEST_VALUE: 'is-lowest-value',
    IS_UPGRADED: 'is-upgraded'
};
/**
   * Handle input on element.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialSlider.prototype.onInput_ = function (event) {
    this.updateValueStyles_();
};
/**
   * Handle change on element.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialSlider.prototype.onChange_ = function (event) {
    this.updateValueStyles_();
};
/**
   * Handle mouseup on element.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialSlider.prototype.onMouseUp_ = function (event) {
    event.target.blur();
};
/**
   * Handle mousedown on container element.
   * This handler is purpose is to not require the use to click
   * exactly on the 2px slider element, as FireFox seems to be very
   * strict about this.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialSlider.prototype.onContainerMouseDown_ = function (event) {
    // If this click is not on the parent element (but rather some child)
    // ignore. It may still bubble up.
    if (event.target !== this.element_.parentElement) {
        return;
    }
    // Discard the original event and create a new event that
    // is on the slider element.
    event.preventDefault();
    var newEvent = new MouseEvent('mousedown', {
        target: event.target,
        buttons: event.buttons,
        clientX: event.clientX,
        clientY: this.element_.getBoundingClientRect().y
    });
    this.element_.dispatchEvent(newEvent);
};
/**
   * Handle updating of values.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialSlider.prototype.updateValueStyles_ = function (event) {
    // Calculate and apply percentages to div structure behind slider.
    var fraction = (this.element_.value - this.element_.min) / (this.element_.max - this.element_.min);
    if (fraction === 0) {
        this.element_.classList.add(this.CssClasses_.IS_LOWEST_VALUE);
    } else {
        this.element_.classList.remove(this.CssClasses_.IS_LOWEST_VALUE);
    }
    if (!this.isIE_) {
        this.backgroundLower_.style.flex = fraction;
        this.backgroundLower_.style.webkitFlex = fraction;
        this.backgroundUpper_.style.flex = 1 - fraction;
        this.backgroundUpper_.style.webkitFlex = 1 - fraction;
    }
};
// Public methods.
/**
   * Disable slider.
   *
   * @public
   */
MaterialSlider.prototype.disable = function () {
    this.element_.disabled = true;
};
/**
   * Enable slider.
   *
   * @public
   */
MaterialSlider.prototype.enable = function () {
    this.element_.disabled = false;
};
/**
   * Update slider value.
   *
   * @param {Number} value The value to which to set the control (optional).
   * @public
   */
MaterialSlider.prototype.change = function (value) {
    if (typeof value !== 'undefined') {
        this.element_.value = value;
    }
    this.updateValueStyles_();
};
/**
   * Initialize element.
   */
MaterialSlider.prototype.init = function () {
    if (this.element_) {
        if (this.isIE_) {
            // Since we need to specify a very large height in IE due to
            // implementation limitations, we add a parent here that trims it down to
            // a reasonable size.
            var containerIE = document.createElement('div');
            containerIE.classList.add(this.CssClasses_.IE_CONTAINER);
            this.element_.parentElement.insertBefore(containerIE, this.element_);
            this.element_.parentElement.removeChild(this.element_);
            containerIE.appendChild(this.element_);
        } else {
            // For non-IE browsers, we need a div structure that sits behind the
            // slider and allows us to style the left and right sides of it with
            // different colors.
            var container = document.createElement('div');
            container.classList.add(this.CssClasses_.SLIDER_CONTAINER);
            this.element_.parentElement.insertBefore(container, this.element_);
            this.element_.parentElement.removeChild(this.element_);
            container.appendChild(this.element_);
            var backgroundFlex = document.createElement('div');
            backgroundFlex.classList.add(this.CssClasses_.BACKGROUND_FLEX);
            container.appendChild(backgroundFlex);
            this.backgroundLower_ = document.createElement('div');
            this.backgroundLower_.classList.add(this.CssClasses_.BACKGROUND_LOWER);
            backgroundFlex.appendChild(this.backgroundLower_);
            this.backgroundUpper_ = document.createElement('div');
            this.backgroundUpper_.classList.add(this.CssClasses_.BACKGROUND_UPPER);
            backgroundFlex.appendChild(this.backgroundUpper_);
        }
        this.boundInputHandler = this.onInput_.bind(this);
        this.boundChangeHandler = this.onChange_.bind(this);
        this.boundMouseUpHandler = this.onMouseUp_.bind(this);
        this.boundContainerMouseDownHandler = this.onContainerMouseDown_.bind(this);
        this.element_.addEventListener('input', this.boundInputHandler);
        this.element_.addEventListener('change', this.boundChangeHandler);
        this.element_.addEventListener('mouseup', this.boundMouseUpHandler);
        this.element_.parentElement.addEventListener('mousedown', this.boundContainerMouseDownHandler);
        this.updateValueStyles_();
        this.element_.classList.add(this.CssClasses_.IS_UPGRADED);
    }
};
/**
   * Downgrade the component
   *
   * @private
   */
MaterialSlider.prototype.mdlDowngrade_ = function () {
    this.element_.removeEventListener('input', this.boundInputHandler);
    this.element_.removeEventListener('change', this.boundChangeHandler);
    this.element_.removeEventListener('mouseup', this.boundMouseUpHandler);
    this.element_.parentElement.removeEventListener('mousedown', this.boundContainerMouseDownHandler);
};
// The component registers itself. It can assume componentHandler is available
// in the global scope.
componentHandler.register({
    constructor: MaterialSlider,
    classAsString: 'MaterialSlider',
    cssClass: 'mdl-js-slider',
    widget: true
});
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
   * Class constructor for Spinner MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @param {HTMLElement} element The element that will be upgraded.
   * @constructor
   */
var MaterialSpinner = function MaterialSpinner(element) {
    this.element_ = element;
    // Initialize instance.
    this.init();
};
window.MaterialSpinner = MaterialSpinner;
/**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {String | Number}
   * @private
   */
MaterialSpinner.prototype.Constant_ = { MDL_SPINNER_LAYER_COUNT: 4 };
/**
   * Store strings for class names defined by this component that are used in
   * JavaScript. This allows us to simply change it in one place should we
   * decide to modify at a later date.
   *
   * @enum {String}
   * @private
   */
MaterialSpinner.prototype.CssClasses_ = {
    MDL_SPINNER_LAYER: 'mdl-spinner__layer',
    MDL_SPINNER_CIRCLE_CLIPPER: 'mdl-spinner__circle-clipper',
    MDL_SPINNER_CIRCLE: 'mdl-spinner__circle',
    MDL_SPINNER_GAP_PATCH: 'mdl-spinner__gap-patch',
    MDL_SPINNER_LEFT: 'mdl-spinner__left',
    MDL_SPINNER_RIGHT: 'mdl-spinner__right'
};
/**
   * Auxiliary method to create a spinner layer.
   *
   * @param {Number} index Index of the layer to be created.
   * @public
   */
MaterialSpinner.prototype.createLayer = function (index) {
    var layer = document.createElement('div');
    layer.classList.add(this.CssClasses_.MDL_SPINNER_LAYER);
    layer.classList.add(this.CssClasses_.MDL_SPINNER_LAYER + '-' + index);
    var leftClipper = document.createElement('div');
    leftClipper.classList.add(this.CssClasses_.MDL_SPINNER_CIRCLE_CLIPPER);
    leftClipper.classList.add(this.CssClasses_.MDL_SPINNER_LEFT);
    var gapPatch = document.createElement('div');
    gapPatch.classList.add(this.CssClasses_.MDL_SPINNER_GAP_PATCH);
    var rightClipper = document.createElement('div');
    rightClipper.classList.add(this.CssClasses_.MDL_SPINNER_CIRCLE_CLIPPER);
    rightClipper.classList.add(this.CssClasses_.MDL_SPINNER_RIGHT);
    var circleOwners = [
        leftClipper,
        gapPatch,
        rightClipper
    ];
    for (var i = 0; i < circleOwners.length; i++) {
        var circle = document.createElement('div');
        circle.classList.add(this.CssClasses_.MDL_SPINNER_CIRCLE);
        circleOwners[i].appendChild(circle);
    }
    layer.appendChild(leftClipper);
    layer.appendChild(gapPatch);
    layer.appendChild(rightClipper);
    this.element_.appendChild(layer);
};
/**
   * Stops the spinner animation.
   * Public method for users who need to stop the spinner for any reason.
   *
   * @public
   */
MaterialSpinner.prototype.stop = function () {
    this.element_.classList.remove('is-active');
};
/**
   * Starts the spinner animation.
   * Public method for users who need to manually start the spinner for any reason
   * (instead of just adding the 'is-active' class to their markup).
   *
   * @public
   */
MaterialSpinner.prototype.start = function () {
    this.element_.classList.add('is-active');
};
/**
   * Initialize element.
   */
MaterialSpinner.prototype.init = function () {
    if (this.element_) {
        for (var i = 1; i <= this.Constant_.MDL_SPINNER_LAYER_COUNT; i++) {
            this.createLayer(i);
        }
        this.element_.classList.add('is-upgraded');
    }
};
// The component registers itself. It can assume componentHandler is available
// in the global scope.
componentHandler.register({
    constructor: MaterialSpinner,
    classAsString: 'MaterialSpinner',
    cssClass: 'mdl-js-spinner',
    widget: true
});
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
   * Class constructor for Checkbox MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @param {HTMLElement} element The element that will be upgraded.
   */
var MaterialSwitch = function MaterialSwitch(element) {
    this.element_ = element;
    // Initialize instance.
    this.init();
};
window.MaterialSwitch = MaterialSwitch;
/**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {String | Number}
   * @private
   */
MaterialSwitch.prototype.Constant_ = { TINY_TIMEOUT: 0.001 };
/**
   * Store strings for class names defined by this component that are used in
   * JavaScript. This allows us to simply change it in one place should we
   * decide to modify at a later date.
   *
   * @enum {String}
   * @private
   */
MaterialSwitch.prototype.CssClasses_ = {
    INPUT: 'mdl-switch__input',
    TRACK: 'mdl-switch__track',
    THUMB: 'mdl-switch__thumb',
    FOCUS_HELPER: 'mdl-switch__focus-helper',
    RIPPLE_EFFECT: 'mdl-js-ripple-effect',
    RIPPLE_IGNORE_EVENTS: 'mdl-js-ripple-effect--ignore-events',
    RIPPLE_CONTAINER: 'mdl-switch__ripple-container',
    RIPPLE_CENTER: 'mdl-ripple--center',
    RIPPLE: 'mdl-ripple',
    IS_FOCUSED: 'is-focused',
    IS_DISABLED: 'is-disabled',
    IS_CHECKED: 'is-checked'
};
/**
   * Handle change of state.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialSwitch.prototype.onChange_ = function (event) {
    this.updateClasses_();
};
/**
   * Handle focus of element.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialSwitch.prototype.onFocus_ = function (event) {
    this.element_.classList.add(this.CssClasses_.IS_FOCUSED);
};
/**
   * Handle lost focus of element.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialSwitch.prototype.onBlur_ = function (event) {
    this.element_.classList.remove(this.CssClasses_.IS_FOCUSED);
};
/**
   * Handle mouseup.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialSwitch.prototype.onMouseUp_ = function (event) {
    this.blur_();
};
/**
   * Handle class updates.
   *
   * @private
   */
MaterialSwitch.prototype.updateClasses_ = function () {
    this.checkDisabled();
    this.checkToggleState();
};
/**
   * Add blur.
   *
   * @private
   */
MaterialSwitch.prototype.blur_ = function (event) {
    // TODO: figure out why there's a focus event being fired after our blur,
    // so that we can avoid this hack.
    window.setTimeout(function () {
        this.inputElement_.blur();
    }.bind(this), this.Constant_.TINY_TIMEOUT);
};
// Public methods.
/**
   * Check the components disabled state.
   *
   * @public
   */
MaterialSwitch.prototype.checkDisabled = function () {
    if (this.inputElement_.disabled) {
        this.element_.classList.add(this.CssClasses_.IS_DISABLED);
    } else {
        this.element_.classList.remove(this.CssClasses_.IS_DISABLED);
    }
};
/**
   * Check the components toggled state.
   *
   * @public
   */
MaterialSwitch.prototype.checkToggleState = function () {
    if (this.inputElement_.checked) {
        this.element_.classList.add(this.CssClasses_.IS_CHECKED);
    } else {
        this.element_.classList.remove(this.CssClasses_.IS_CHECKED);
    }
};
/**
   * Disable switch.
   *
   * @public
   */
MaterialSwitch.prototype.disable = function () {
    this.inputElement_.disabled = true;
    this.updateClasses_();
};
/**
   * Enable switch.
   *
   * @public
   */
MaterialSwitch.prototype.enable = function () {
    this.inputElement_.disabled = false;
    this.updateClasses_();
};
/**
   * Activate switch.
   *
   * @public
   */
MaterialSwitch.prototype.on = function () {
    this.inputElement_.checked = true;
    this.updateClasses_();
};
/**
   * Deactivate switch.
   *
   * @public
   */
MaterialSwitch.prototype.off = function () {
    this.inputElement_.checked = false;
    this.updateClasses_();
};
/**
   * Initialize element.
   */
MaterialSwitch.prototype.init = function () {
    if (this.element_) {
        this.inputElement_ = this.element_.querySelector('.' + this.CssClasses_.INPUT);
        var track = document.createElement('div');
        track.classList.add(this.CssClasses_.TRACK);
        var thumb = document.createElement('div');
        thumb.classList.add(this.CssClasses_.THUMB);
        var focusHelper = document.createElement('span');
        focusHelper.classList.add(this.CssClasses_.FOCUS_HELPER);
        thumb.appendChild(focusHelper);
        this.element_.appendChild(track);
        this.element_.appendChild(thumb);
        this.boundMouseUpHandler = this.onMouseUp_.bind(this);
        if (this.element_.classList.contains(this.CssClasses_.RIPPLE_EFFECT)) {
            this.element_.classList.add(this.CssClasses_.RIPPLE_IGNORE_EVENTS);
            this.rippleContainerElement_ = document.createElement('span');
            this.rippleContainerElement_.classList.add(this.CssClasses_.RIPPLE_CONTAINER);
            this.rippleContainerElement_.classList.add(this.CssClasses_.RIPPLE_EFFECT);
            this.rippleContainerElement_.classList.add(this.CssClasses_.RIPPLE_CENTER);
            this.rippleContainerElement_.addEventListener('mouseup', this.boundMouseUpHandler);
            var ripple = document.createElement('span');
            ripple.classList.add(this.CssClasses_.RIPPLE);
            this.rippleContainerElement_.appendChild(ripple);
            this.element_.appendChild(this.rippleContainerElement_);
        }
        this.boundChangeHandler = this.onChange_.bind(this);
        this.boundFocusHandler = this.onFocus_.bind(this);
        this.boundBlurHandler = this.onBlur_.bind(this);
        this.inputElement_.addEventListener('change', this.boundChangeHandler);
        this.inputElement_.addEventListener('focus', this.boundFocusHandler);
        this.inputElement_.addEventListener('blur', this.boundBlurHandler);
        this.element_.addEventListener('mouseup', this.boundMouseUpHandler);
        this.updateClasses_();
        this.element_.classList.add('is-upgraded');
    }
};
/**
   * Downgrade the component.
   *
   * @private
   */
MaterialSwitch.prototype.mdlDowngrade_ = function () {
    if (this.rippleContainerElement_) {
        this.rippleContainerElement_.removeEventListener('mouseup', this.boundMouseUpHandler);
    }
    this.inputElement_.removeEventListener('change', this.boundChangeHandler);
    this.inputElement_.removeEventListener('focus', this.boundFocusHandler);
    this.inputElement_.removeEventListener('blur', this.boundBlurHandler);
    this.element_.removeEventListener('mouseup', this.boundMouseUpHandler);
};
// The component registers itself. It can assume componentHandler is available
// in the global scope.
componentHandler.register({
    constructor: MaterialSwitch,
    classAsString: 'MaterialSwitch',
    cssClass: 'mdl-js-switch',
    widget: true
});
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
   * Class constructor for Tabs MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @param {HTMLElement} element The element that will be upgraded.
   */
var MaterialTabs = function MaterialTabs(element) {
    // Stores the HTML element.
    this.element_ = element;
    // Initialize instance.
    this.init();
};
window.MaterialTabs = MaterialTabs;
/**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {String}
   * @private
   */
MaterialTabs.prototype.Constant_ = {};
/**
   * Store strings for class names defined by this component that are used in
   * JavaScript. This allows us to simply change it in one place should we
   * decide to modify at a later date.
   *
   * @enum {String}
   * @private
   */
MaterialTabs.prototype.CssClasses_ = {
    TAB_CLASS: 'mdl-tabs__tab',
    PANEL_CLASS: 'mdl-tabs__panel',
    ACTIVE_CLASS: 'is-active',
    UPGRADED_CLASS: 'is-upgraded',
    MDL_JS_RIPPLE_EFFECT: 'mdl-js-ripple-effect',
    MDL_RIPPLE_CONTAINER: 'mdl-tabs__ripple-container',
    MDL_RIPPLE: 'mdl-ripple',
    MDL_JS_RIPPLE_EFFECT_IGNORE_EVENTS: 'mdl-js-ripple-effect--ignore-events'
};
/**
   * Handle clicks to a tabs component
   *
   * @private
   */
MaterialTabs.prototype.initTabs_ = function () {
    if (this.element_.classList.contains(this.CssClasses_.MDL_JS_RIPPLE_EFFECT)) {
        this.element_.classList.add(this.CssClasses_.MDL_JS_RIPPLE_EFFECT_IGNORE_EVENTS);
    }
    // Select element tabs, document panels
    this.tabs_ = this.element_.querySelectorAll('.' + this.CssClasses_.TAB_CLASS);
    this.panels_ = this.element_.querySelectorAll('.' + this.CssClasses_.PANEL_CLASS);
    // Create new tabs for each tab element
    for (var i = 0; i < this.tabs_.length; i++) {
        new MaterialTab(this.tabs_[i], this);
    }
    this.element_.classList.add(this.CssClasses_.UPGRADED_CLASS);
};
/**
   * Reset tab state, dropping active classes
   *
   * @private
   */
MaterialTabs.prototype.resetTabState_ = function () {
    for (var k = 0; k < this.tabs_.length; k++) {
        this.tabs_[k].classList.remove(this.CssClasses_.ACTIVE_CLASS);
    }
};
/**
   * Reset panel state, droping active classes
   *
   * @private
   */
MaterialTabs.prototype.resetPanelState_ = function () {
    for (var j = 0; j < this.panels_.length; j++) {
        this.panels_[j].classList.remove(this.CssClasses_.ACTIVE_CLASS);
    }
};
/**
   * Initialize element.
   */
MaterialTabs.prototype.init = function () {
    if (this.element_) {
        this.initTabs_();
    }
};
function MaterialTab(tab, ctx) {
    if (tab) {
        if (ctx.element_.classList.contains(ctx.CssClasses_.MDL_JS_RIPPLE_EFFECT)) {
            var rippleContainer = document.createElement('span');
            rippleContainer.classList.add(ctx.CssClasses_.MDL_RIPPLE_CONTAINER);
            rippleContainer.classList.add(ctx.CssClasses_.MDL_JS_RIPPLE_EFFECT);
            var ripple = document.createElement('span');
            ripple.classList.add(ctx.CssClasses_.MDL_RIPPLE);
            rippleContainer.appendChild(ripple);
            tab.appendChild(rippleContainer);
        }
        tab.addEventListener('click', function (e) {
            e.preventDefault();
            var href = tab.href.split('#')[1];
            var panel = ctx.element_.querySelector('#' + href);
            ctx.resetTabState_();
            ctx.resetPanelState_();
            tab.classList.add(ctx.CssClasses_.ACTIVE_CLASS);
            panel.classList.add(ctx.CssClasses_.ACTIVE_CLASS);
        });
    }
}
// The component registers itself. It can assume componentHandler is available
// in the global scope.
componentHandler.register({
    constructor: MaterialTabs,
    classAsString: 'MaterialTabs',
    cssClass: 'mdl-js-tabs'
});
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
   * Class constructor for Textfield MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @param {HTMLElement} element The element that will be upgraded.
   */
var MaterialTextfield = function MaterialTextfield(element) {
    this.element_ = element;
    this.maxRows = this.Constant_.NO_MAX_ROWS;
    // Initialize instance.
    this.init();
};
window.MaterialTextfield = MaterialTextfield;
/**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {String | Number}
   * @private
   */
MaterialTextfield.prototype.Constant_ = {
    NO_MAX_ROWS: -1,
    MAX_ROWS_ATTRIBUTE: 'maxrows'
};
/**
   * Store strings for class names defined by this component that are used in
   * JavaScript. This allows us to simply change it in one place should we
   * decide to modify at a later date.
   *
   * @enum {String}
   * @private
   */
MaterialTextfield.prototype.CssClasses_ = {
    LABEL: 'mdl-textfield__label',
    INPUT: 'mdl-textfield__input',
    IS_DIRTY: 'is-dirty',
    IS_FOCUSED: 'is-focused',
    IS_DISABLED: 'is-disabled',
    IS_INVALID: 'is-invalid',
    IS_UPGRADED: 'is-upgraded'
};
/**
   * Handle input being entered.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialTextfield.prototype.onKeyDown_ = function (event) {
    var currentRowCount = event.target.value.split('\n').length;
    if (event.keyCode === 13) {
        if (currentRowCount >= this.maxRows) {
            event.preventDefault();
        }
    }
};
/**
   * Handle focus.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialTextfield.prototype.onFocus_ = function (event) {
    this.element_.classList.add(this.CssClasses_.IS_FOCUSED);
};
/**
   * Handle lost focus.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialTextfield.prototype.onBlur_ = function (event) {
    this.element_.classList.remove(this.CssClasses_.IS_FOCUSED);
};
/**
   * Handle class updates.
   *
   * @private
   */
MaterialTextfield.prototype.updateClasses_ = function () {
    this.checkDisabled();
    this.checkValidity();
    this.checkDirty();
};
// Public methods.
/**
   * Check the disabled state and update field accordingly.
   *
   * @public
   */
MaterialTextfield.prototype.checkDisabled = function () {
    if (this.input_.disabled) {
        this.element_.classList.add(this.CssClasses_.IS_DISABLED);
    } else {
        this.element_.classList.remove(this.CssClasses_.IS_DISABLED);
    }
};
/**
   * Check the validity state and update field accordingly.
   *
   * @public
   */
MaterialTextfield.prototype.checkValidity = function () {
    if (this.input_.validity.valid) {
        this.element_.classList.remove(this.CssClasses_.IS_INVALID);
    } else {
        this.element_.classList.add(this.CssClasses_.IS_INVALID);
    }
};
/**
   * Check the dirty state and update field accordingly.
   *
   * @public
   */
MaterialTextfield.prototype.checkDirty = function () {
    if (this.input_.value && this.input_.value.length > 0) {
        this.element_.classList.add(this.CssClasses_.IS_DIRTY);
    } else {
        this.element_.classList.remove(this.CssClasses_.IS_DIRTY);
    }
};
/**
   * Disable text field.
   *
   * @public
   */
MaterialTextfield.prototype.disable = function () {
    this.input_.disabled = true;
    this.updateClasses_();
};
/**
   * Enable text field.
   *
   * @public
   */
MaterialTextfield.prototype.enable = function () {
    this.input_.disabled = false;
    this.updateClasses_();
};
/**
   * Update text field value.
   *
   * @param {String} value The value to which to set the control (optional).
   * @public
   */
MaterialTextfield.prototype.change = function (value) {
    if (value) {
        this.input_.value = value;
    }
    this.updateClasses_();
};
/**
   * Initialize element.
   */
MaterialTextfield.prototype.init = function () {
    if (this.element_) {
        this.label_ = this.element_.querySelector('.' + this.CssClasses_.LABEL);
        this.input_ = this.element_.querySelector('.' + this.CssClasses_.INPUT);
        if (this.input_) {
            if (this.input_.hasAttribute(this.Constant_.MAX_ROWS_ATTRIBUTE)) {
                this.maxRows = parseInt(this.input_.getAttribute(this.Constant_.MAX_ROWS_ATTRIBUTE), 10);
                if (isNaN(this.maxRows)) {
                    this.maxRows = this.Constant_.NO_MAX_ROWS;
                }
            }
            this.boundUpdateClassesHandler = this.updateClasses_.bind(this);
            this.boundFocusHandler = this.onFocus_.bind(this);
            this.boundBlurHandler = this.onBlur_.bind(this);
            this.input_.addEventListener('input', this.boundUpdateClassesHandler);
            this.input_.addEventListener('focus', this.boundFocusHandler);
            this.input_.addEventListener('blur', this.boundBlurHandler);
            if (this.maxRows !== this.Constant_.NO_MAX_ROWS) {
                // TODO: This should handle pasting multi line text.
                // Currently doesn't.
                this.boundKeyDownHandler = this.onKeyDown_.bind(this);
                this.input_.addEventListener('keydown', this.boundKeyDownHandler);
            }
            this.updateClasses_();
            this.element_.classList.add(this.CssClasses_.IS_UPGRADED);
        }
    }
};
/**
   * Downgrade the component
   *
   * @private
   */
MaterialTextfield.prototype.mdlDowngrade_ = function () {
    this.input_.removeEventListener('input', this.boundUpdateClassesHandler);
    this.input_.removeEventListener('focus', this.boundFocusHandler);
    this.input_.removeEventListener('blur', this.boundBlurHandler);
    if (this.boundKeyDownHandler) {
        this.input_.removeEventListener('keydown', this.boundKeyDownHandler);
    }
};
// The component registers itself. It can assume componentHandler is available
// in the global scope.
componentHandler.register({
    constructor: MaterialTextfield,
    classAsString: 'MaterialTextfield',
    cssClass: 'mdl-js-textfield',
    widget: true
});
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
   * Class constructor for Tooltip MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @param {HTMLElement} element The element that will be upgraded.
   */
var MaterialTooltip = function MaterialTooltip(element) {
    this.element_ = element;
    // Initialize instance.
    this.init();
};
window.MaterialTooltip = MaterialTooltip;
/**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {String | Number}
   * @private
   */
MaterialTooltip.prototype.Constant_ = {};
/**
   * Store strings for class names defined by this component that are used in
   * JavaScript. This allows us to simply change it in one place should we
   * decide to modify at a later date.
   *
   * @enum {String}
   * @private
   */
MaterialTooltip.prototype.CssClasses_ = { IS_ACTIVE: 'is-active' };
/**
   * Handle mouseenter for tooltip.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialTooltip.prototype.handleMouseEnter_ = function (event) {
    event.stopPropagation();
    var props = event.target.getBoundingClientRect();
    var left = props.left + props.width / 2;
    var marginLeft = -1 * (this.element_.offsetWidth / 2);
    if (left + marginLeft < 0) {
        this.element_.style.left = 0;
        this.element_.style.marginLeft = 0;
    } else {
        this.element_.style.left = left + 'px';
        this.element_.style.marginLeft = marginLeft + 'px';
    }
    this.element_.style.top = props.top + props.height + 10 + 'px';
    this.element_.classList.add(this.CssClasses_.IS_ACTIVE);
    window.addEventListener('scroll', this.boundMouseLeaveHandler, false);
    window.addEventListener('touchmove', this.boundMouseLeaveHandler, false);
};
/**
   * Handle mouseleave for tooltip.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialTooltip.prototype.handleMouseLeave_ = function (event) {
    event.stopPropagation();
    this.element_.classList.remove(this.CssClasses_.IS_ACTIVE);
    window.removeEventListener('scroll', this.boundMouseLeaveHandler);
    window.removeEventListener('touchmove', this.boundMouseLeaveHandler, false);
};
/**
   * Initialize element.
   */
MaterialTooltip.prototype.init = function () {
    if (this.element_) {
        var forElId = this.element_.getAttribute('for');
        if (forElId) {
            this.forElement_ = document.getElementById(forElId);
        }
        if (this.forElement_) {
            // Tabindex needs to be set for `blur` events to be emitted
            if (!this.forElement_.getAttribute('tabindex')) {
                this.forElement_.setAttribute('tabindex', '0');
            }
            this.boundMouseEnterHandler = this.handleMouseEnter_.bind(this);
            this.boundMouseLeaveHandler = this.handleMouseLeave_.bind(this);
            this.forElement_.addEventListener('mouseenter', this.boundMouseEnterHandler, false);
            this.forElement_.addEventListener('click', this.boundMouseEnterHandler, false);
            this.forElement_.addEventListener('blur', this.boundMouseLeaveHandler);
            this.forElement_.addEventListener('touchstart', this.boundMouseEnterHandler, false);
            this.forElement_.addEventListener('mouseleave', this.boundMouseLeaveHandler);
        }
    }
};
/**
   * Downgrade the component
   *
   * @private
   */
MaterialTooltip.prototype.mdlDowngrade_ = function () {
    if (this.forElement_) {
        this.forElement_.removeEventListener('mouseenter', this.boundMouseEnterHandler, false);
        this.forElement_.removeEventListener('click', this.boundMouseEnterHandler, false);
        this.forElement_.removeEventListener('touchstart', this.boundMouseEnterHandler, false);
        this.forElement_.removeEventListener('mouseleave', this.boundMouseLeaveHandler);
    }
};
// The component registers itself. It can assume componentHandler is available
// in the global scope.
componentHandler.register({
    constructor: MaterialTooltip,
    classAsString: 'MaterialTooltip',
    cssClass: 'mdl-tooltip'
});
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
   * Class constructor for Layout MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @param {HTMLElement} element The element that will be upgraded.
   */
var MaterialLayout = function MaterialLayout(element) {
    this.element_ = element;
    // Initialize instance.
    this.init();
};
window.MaterialLayout = MaterialLayout;
/**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {String | Number}
   * @private
   */
MaterialLayout.prototype.Constant_ = {
    MAX_WIDTH: '(max-width: 1024px)',
    TAB_SCROLL_PIXELS: 100,
    MENU_ICON: 'menu',
    CHEVRON_LEFT: 'chevron_left',
    CHEVRON_RIGHT: 'chevron_right'
};
/**
   * Modes.
   *
   * @enum {Number}
   * @private
   */
MaterialLayout.prototype.Mode_ = {
    STANDARD: 0,
    SEAMED: 1,
    WATERFALL: 2,
    SCROLL: 3
};
/**
   * Store strings for class names defined by this component that are used in
   * JavaScript. This allows us to simply change it in one place should we
   * decide to modify at a later date.
   *
   * @enum {String}
   * @private
   */
MaterialLayout.prototype.CssClasses_ = {
    CONTAINER: 'mdl-layout__container',
    HEADER: 'mdl-layout__header',
    DRAWER: 'mdl-layout__drawer',
    CONTENT: 'mdl-layout__content',
    DRAWER_BTN: 'mdl-layout__drawer-button',
    ICON: 'material-icons',
    JS_RIPPLE_EFFECT: 'mdl-js-ripple-effect',
    RIPPLE_CONTAINER: 'mdl-layout__tab-ripple-container',
    RIPPLE: 'mdl-ripple',
    RIPPLE_IGNORE_EVENTS: 'mdl-js-ripple-effect--ignore-events',
    HEADER_SEAMED: 'mdl-layout__header--seamed',
    HEADER_WATERFALL: 'mdl-layout__header--waterfall',
    HEADER_SCROLL: 'mdl-layout__header--scroll',
    FIXED_HEADER: 'mdl-layout--fixed-header',
    OBFUSCATOR: 'mdl-layout__obfuscator',
    TAB_BAR: 'mdl-layout__tab-bar',
    TAB_CONTAINER: 'mdl-layout__tab-bar-container',
    TAB: 'mdl-layout__tab',
    TAB_BAR_BUTTON: 'mdl-layout__tab-bar-button',
    TAB_BAR_LEFT_BUTTON: 'mdl-layout__tab-bar-left-button',
    TAB_BAR_RIGHT_BUTTON: 'mdl-layout__tab-bar-right-button',
    PANEL: 'mdl-layout__tab-panel',
    HAS_DRAWER: 'has-drawer',
    HAS_TABS: 'has-tabs',
    HAS_SCROLLING_HEADER: 'has-scrolling-header',
    CASTING_SHADOW: 'is-casting-shadow',
    IS_COMPACT: 'is-compact',
    IS_SMALL_SCREEN: 'is-small-screen',
    IS_DRAWER_OPEN: 'is-visible',
    IS_ACTIVE: 'is-active',
    IS_UPGRADED: 'is-upgraded',
    IS_ANIMATING: 'is-animating',
    ON_LARGE_SCREEN: 'mdl-layout--large-screen-only',
    ON_SMALL_SCREEN: 'mdl-layout--small-screen-only'
};
/**
   * Handles scrolling on the content.
   *
   * @private
   */
MaterialLayout.prototype.contentScrollHandler_ = function () {
    if (this.header_.classList.contains(this.CssClasses_.IS_ANIMATING)) {
        return;
    }
    if (this.content_.scrollTop > 0 && !this.header_.classList.contains(this.CssClasses_.IS_COMPACT)) {
        this.header_.classList.add(this.CssClasses_.CASTING_SHADOW);
        this.header_.classList.add(this.CssClasses_.IS_COMPACT);
        this.header_.classList.add(this.CssClasses_.IS_ANIMATING);
    } else if (this.content_.scrollTop <= 0 && this.header_.classList.contains(this.CssClasses_.IS_COMPACT)) {
        this.header_.classList.remove(this.CssClasses_.CASTING_SHADOW);
        this.header_.classList.remove(this.CssClasses_.IS_COMPACT);
        this.header_.classList.add(this.CssClasses_.IS_ANIMATING);
    }
};
/**
   * Handles changes in screen size.
   *
   * @private
   */
MaterialLayout.prototype.screenSizeHandler_ = function () {
    if (this.screenSizeMediaQuery_.matches) {
        this.element_.classList.add(this.CssClasses_.IS_SMALL_SCREEN);
    } else {
        this.element_.classList.remove(this.CssClasses_.IS_SMALL_SCREEN);
        // Collapse drawer (if any) when moving to a large screen size.
        if (this.drawer_) {
            this.drawer_.classList.remove(this.CssClasses_.IS_DRAWER_OPEN);
        }
    }
};
/**
   * Handles toggling of the drawer.
   *
   * @private
   */
MaterialLayout.prototype.drawerToggleHandler_ = function () {
    this.drawer_.classList.toggle(this.CssClasses_.IS_DRAWER_OPEN);
};
/**
   * Handles (un)setting the `is-animating` class
   *
   * @private
   */
MaterialLayout.prototype.headerTransitionEndHandler_ = function () {
    this.header_.classList.remove(this.CssClasses_.IS_ANIMATING);
};
/**
   * Handles expanding the header on click
   *
   * @private
   */
MaterialLayout.prototype.headerClickHandler_ = function () {
    if (this.header_.classList.contains(this.CssClasses_.IS_COMPACT)) {
        this.header_.classList.remove(this.CssClasses_.IS_COMPACT);
        this.header_.classList.add(this.CssClasses_.IS_ANIMATING);
    }
};
/**
   * Reset tab state, dropping active classes
   *
   * @private
   */
MaterialLayout.prototype.resetTabState_ = function (tabBar) {
    for (var k = 0; k < tabBar.length; k++) {
        tabBar[k].classList.remove(this.CssClasses_.IS_ACTIVE);
    }
};
/**
   * Reset panel state, droping active classes
   *
   * @private
   */
MaterialLayout.prototype.resetPanelState_ = function (panels) {
    for (var j = 0; j < panels.length; j++) {
        panels[j].classList.remove(this.CssClasses_.IS_ACTIVE);
    }
};
/**
   * Initialize element.
   */
MaterialLayout.prototype.init = function () {
    if (this.element_) {
        var container = document.createElement('div');
        container.classList.add(this.CssClasses_.CONTAINER);
        this.element_.parentElement.insertBefore(container, this.element_);
        this.element_.parentElement.removeChild(this.element_);
        container.appendChild(this.element_);
        var directChildren = this.element_.childNodes;
        for (var c = 0; c < directChildren.length; c++) {
            var child = directChildren[c];
            if (child.classList && child.classList.contains(this.CssClasses_.HEADER)) {
                this.header_ = child;
            }
            if (child.classList && child.classList.contains(this.CssClasses_.DRAWER)) {
                this.drawer_ = child;
            }
            if (child.classList && child.classList.contains(this.CssClasses_.CONTENT)) {
                this.content_ = child;
            }
        }
        if (this.header_) {
            this.tabBar_ = this.header_.querySelector('.' + this.CssClasses_.TAB_BAR);
        }
        var mode = this.Mode_.STANDARD;
        // Keep an eye on screen size, and add/remove auxiliary class for styling
        // of small screens.
        this.screenSizeMediaQuery_ = window.matchMedia(this.Constant_.MAX_WIDTH);
        this.screenSizeMediaQuery_.addListener(this.screenSizeHandler_.bind(this));
        this.screenSizeHandler_();
        if (this.header_) {
            if (this.header_.classList.contains(this.CssClasses_.HEADER_SEAMED)) {
                mode = this.Mode_.SEAMED;
            } else if (this.header_.classList.contains(this.CssClasses_.HEADER_WATERFALL)) {
                mode = this.Mode_.WATERFALL;
                this.header_.addEventListener('transitionend', this.headerTransitionEndHandler_.bind(this));
                this.header_.addEventListener('click', this.headerClickHandler_.bind(this));
            } else if (this.header_.classList.contains(this.CssClasses_.HEADER_SCROLL)) {
                mode = this.Mode_.SCROLL;
                container.classList.add(this.CssClasses_.HAS_SCROLLING_HEADER);
            }
            if (mode === this.Mode_.STANDARD) {
                this.header_.classList.add(this.CssClasses_.CASTING_SHADOW);
                if (this.tabBar_) {
                    this.tabBar_.classList.add(this.CssClasses_.CASTING_SHADOW);
                }
            } else if (mode === this.Mode_.SEAMED || mode === this.Mode_.SCROLL) {
                this.header_.classList.remove(this.CssClasses_.CASTING_SHADOW);
                if (this.tabBar_) {
                    this.tabBar_.classList.remove(this.CssClasses_.CASTING_SHADOW);
                }
            } else if (mode === this.Mode_.WATERFALL) {
                // Add and remove shadows depending on scroll position.
                // Also add/remove auxiliary class for styling of the compact version of
                // the header.
                this.content_.addEventListener('scroll', this.contentScrollHandler_.bind(this));
                this.contentScrollHandler_();
            }
        }
        var eatEvent = function (ev) {
            ev.preventDefault();
        };
        // Add drawer toggling button to our layout, if we have an openable drawer.
        if (this.drawer_) {
            var drawerButton = document.createElement('div');
            drawerButton.classList.add(this.CssClasses_.DRAWER_BTN);
            if (this.drawer_.classList.contains(this.CssClasses_.ON_LARGE_SCREEN)) {
                //If drawer has ON_LARGE_SCREEN class then add it to the drawer toggle button as well.
                drawerButton.classList.add(this.CssClasses_.ON_LARGE_SCREEN);
            } else if (this.drawer_.classList.contains(this.CssClasses_.ON_SMALL_SCREEN)) {
                //If drawer has ON_SMALL_SCREEN class then add it to the drawer toggle button as well.
                drawerButton.classList.add(this.CssClasses_.ON_SMALL_SCREEN);
            }
            var drawerButtonIcon = document.createElement('i');
            drawerButtonIcon.classList.add(this.CssClasses_.ICON);
            drawerButtonIcon.textContent = this.Constant_.MENU_ICON;
            drawerButton.appendChild(drawerButtonIcon);
            drawerButton.addEventListener('click', this.drawerToggleHandler_.bind(this));
            // Add a class if the layout has a drawer, for altering the left padding.
            // Adds the HAS_DRAWER to the elements since this.header_ may or may
            // not be present.
            this.element_.classList.add(this.CssClasses_.HAS_DRAWER);
            this.drawer_.addEventListener('mousewheel', eatEvent);
            // If we have a fixed header, add the button to the header rather than
            // the layout.
            if (this.element_.classList.contains(this.CssClasses_.FIXED_HEADER)) {
                this.header_.insertBefore(drawerButton, this.header_.firstChild);
            } else {
                this.element_.insertBefore(drawerButton, this.content_);
            }
            var obfuscator = document.createElement('div');
            obfuscator.classList.add(this.CssClasses_.OBFUSCATOR);
            this.element_.appendChild(obfuscator);
            obfuscator.addEventListener('click', this.drawerToggleHandler_.bind(this));
            obfuscator.addEventListener('mousewheel', eatEvent);
        }
        // Initialize tabs, if any.
        if (this.header_ && this.tabBar_) {
            this.element_.classList.add(this.CssClasses_.HAS_TABS);
            var tabContainer = document.createElement('div');
            tabContainer.classList.add(this.CssClasses_.TAB_CONTAINER);
            this.header_.insertBefore(tabContainer, this.tabBar_);
            this.header_.removeChild(this.tabBar_);
            var leftButton = document.createElement('div');
            leftButton.classList.add(this.CssClasses_.TAB_BAR_BUTTON);
            leftButton.classList.add(this.CssClasses_.TAB_BAR_LEFT_BUTTON);
            var leftButtonIcon = document.createElement('i');
            leftButtonIcon.classList.add(this.CssClasses_.ICON);
            leftButtonIcon.textContent = this.Constant_.CHEVRON_LEFT;
            leftButton.appendChild(leftButtonIcon);
            leftButton.addEventListener('click', function () {
                this.tabBar_.scrollLeft -= this.Constant_.TAB_SCROLL_PIXELS;
            }.bind(this));
            var rightButton = document.createElement('div');
            rightButton.classList.add(this.CssClasses_.TAB_BAR_BUTTON);
            rightButton.classList.add(this.CssClasses_.TAB_BAR_RIGHT_BUTTON);
            var rightButtonIcon = document.createElement('i');
            rightButtonIcon.classList.add(this.CssClasses_.ICON);
            rightButtonIcon.textContent = this.Constant_.CHEVRON_RIGHT;
            rightButton.appendChild(rightButtonIcon);
            rightButton.addEventListener('click', function () {
                this.tabBar_.scrollLeft += this.Constant_.TAB_SCROLL_PIXELS;
            }.bind(this));
            tabContainer.appendChild(leftButton);
            tabContainer.appendChild(this.tabBar_);
            tabContainer.appendChild(rightButton);
            // Add and remove buttons depending on scroll position.
            var tabScrollHandler = function () {
                if (this.tabBar_.scrollLeft > 0) {
                    leftButton.classList.add(this.CssClasses_.IS_ACTIVE);
                } else {
                    leftButton.classList.remove(this.CssClasses_.IS_ACTIVE);
                }
                if (this.tabBar_.scrollLeft < this.tabBar_.scrollWidth - this.tabBar_.offsetWidth) {
                    rightButton.classList.add(this.CssClasses_.IS_ACTIVE);
                } else {
                    rightButton.classList.remove(this.CssClasses_.IS_ACTIVE);
                }
            }.bind(this);
            this.tabBar_.addEventListener('scroll', tabScrollHandler);
            tabScrollHandler();
            if (this.tabBar_.classList.contains(this.CssClasses_.JS_RIPPLE_EFFECT)) {
                this.tabBar_.classList.add(this.CssClasses_.RIPPLE_IGNORE_EVENTS);
            }
            // Select element tabs, document panels
            var tabs = this.tabBar_.querySelectorAll('.' + this.CssClasses_.TAB);
            var panels = this.content_.querySelectorAll('.' + this.CssClasses_.PANEL);
            // Create new tabs for each tab element
            for (var i = 0; i < tabs.length; i++) {
                new MaterialLayoutTab(tabs[i], tabs, panels, this);
            }
        }
        this.element_.classList.add(this.CssClasses_.IS_UPGRADED);
    }
};
function MaterialLayoutTab(tab, tabs, panels, layout) {
    if (tab) {
        if (layout.tabBar_.classList.contains(layout.CssClasses_.JS_RIPPLE_EFFECT)) {
            var rippleContainer = document.createElement('span');
            rippleContainer.classList.add(layout.CssClasses_.RIPPLE_CONTAINER);
            rippleContainer.classList.add(layout.CssClasses_.JS_RIPPLE_EFFECT);
            var ripple = document.createElement('span');
            ripple.classList.add(layout.CssClasses_.RIPPLE);
            rippleContainer.appendChild(ripple);
            tab.appendChild(rippleContainer);
        }
        tab.addEventListener('click', function (e) {
            e.preventDefault();
            var href = tab.href.split('#')[1];
            var panel = layout.content_.querySelector('#' + href);
            layout.resetTabState_(tabs);
            layout.resetPanelState_(panels);
            tab.classList.add(layout.CssClasses_.IS_ACTIVE);
            panel.classList.add(layout.CssClasses_.IS_ACTIVE);
        });
    }
}
// The component registers itself. It can assume componentHandler is available
// in the global scope.
componentHandler.register({
    constructor: MaterialLayout,
    classAsString: 'MaterialLayout',
    cssClass: 'mdl-js-layout'
});
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
   * Class constructor for Data Table Card MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @param {HTMLElement} element The element that will be upgraded.
   */
var MaterialDataTable = function MaterialDataTable(element) {
    this.element_ = element;
    // Initialize instance.
    this.init();
};
window.MaterialDataTable = MaterialDataTable;
/**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {String | Number}
   * @private
   */
MaterialDataTable.prototype.Constant_ = {};
/**
   * Store strings for class names defined by this component that are used in
   * JavaScript. This allows us to simply change it in one place should we
   * decide to modify at a later date.
   *
   * @enum {String}
   * @private
   */
MaterialDataTable.prototype.CssClasses_ = {
    DATA_TABLE: 'mdl-data-table',
    SELECTABLE: 'mdl-data-table--selectable',
    IS_SELECTED: 'is-selected',
    IS_UPGRADED: 'is-upgraded'
};
/**
   * Generates and returns a function that toggles the selection state of a
   * single row (or multiple rows).
   *
   * @param {HTMLElement} checkbox Checkbox that toggles the selection state.
   * @param {HTMLElement} row Row to toggle when checkbox changes.
   * @param {HTMLElement[]} rows Rows to toggle when checkbox changes.
   * @private
   */
MaterialDataTable.prototype.selectRow_ = function (checkbox, row, rows) {
    if (row) {
        return function () {
            if (checkbox.checked) {
                row.classList.add(this.CssClasses_.IS_SELECTED);
            } else {
                row.classList.remove(this.CssClasses_.IS_SELECTED);
            }
        }.bind(this);
    }
    if (rows) {
        return function () {
            var i;
            var el;
            if (checkbox.checked) {
                for (i = 0; i < rows.length; i++) {
                    el = rows[i].querySelector('td').querySelector('.mdl-checkbox');
                    el.MaterialCheckbox.check();
                    rows[i].classList.add(this.CssClasses_.IS_SELECTED);
                }
            } else {
                for (i = 0; i < rows.length; i++) {
                    el = rows[i].querySelector('td').querySelector('.mdl-checkbox');
                    el.MaterialCheckbox.uncheck();
                    rows[i].classList.remove(this.CssClasses_.IS_SELECTED);
                }
            }
        }.bind(this);
    }
};
/**
   * Creates a checkbox for a single or or multiple rows and hooks up the
   * event handling.
   *
   * @param {HTMLElement} row Row to toggle when checkbox changes.
   * @param {HTMLElement[]} rows Rows to toggle when checkbox changes.
   * @private
   */
MaterialDataTable.prototype.createCheckbox_ = function (row, rows) {
    var label = document.createElement('label');
    label.classList.add('mdl-checkbox');
    label.classList.add('mdl-js-checkbox');
    label.classList.add('mdl-js-ripple-effect');
    label.classList.add('mdl-data-table__select');
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('mdl-checkbox__input');
    if (row) {
        checkbox.addEventListener('change', this.selectRow_(checkbox, row));
    } else if (rows) {
        checkbox.addEventListener('change', this.selectRow_(checkbox, null, rows));
    }
    label.appendChild(checkbox);
    componentHandler.upgradeElement(label, 'MaterialCheckbox');
    return label;
};
/**
   * Initialize element.
   */
MaterialDataTable.prototype.init = function () {
    if (this.element_) {
        var firstHeader = this.element_.querySelector('th');
        var rows = this.element_.querySelector('tbody').querySelectorAll('tr');
        if (this.element_.classList.contains(this.CssClasses_.SELECTABLE)) {
            var th = document.createElement('th');
            var headerCheckbox = this.createCheckbox_(null, rows);
            th.appendChild(headerCheckbox);
            firstHeader.parentElement.insertBefore(th, firstHeader);
            for (var i = 0; i < rows.length; i++) {
                var firstCell = rows[i].querySelector('td');
                if (firstCell) {
                    var td = document.createElement('td');
                    var rowCheckbox = this.createCheckbox_(rows[i]);
                    td.appendChild(rowCheckbox);
                    rows[i].insertBefore(td, firstCell);
                }
            }
        }
        this.element_.classList.add(this.CssClasses_.IS_UPGRADED);
    }
};
// The component registers itself. It can assume componentHandler is available
// in the global scope.
componentHandler.register({
    constructor: MaterialDataTable,
    classAsString: 'MaterialDataTable',
    cssClass: 'mdl-js-data-table'
});
/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
   * Class constructor for Ripple MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @param {HTMLElement} element The element that will be upgraded.
   */
var MaterialRipple = function MaterialRipple(element) {
    this.element_ = element;
    // Initialize instance.
    this.init();
};
window.MaterialRipple = MaterialRipple;
/**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {String | Number}
   * @private
   */
MaterialRipple.prototype.Constant_ = {
    INITIAL_SCALE: 'scale(0.0001, 0.0001)',
    INITIAL_SIZE: '1px',
    INITIAL_OPACITY: '0.4',
    FINAL_OPACITY: '0',
    FINAL_SCALE: ''
};
/**
   * Store strings for class names defined by this component that are used in
   * JavaScript. This allows us to simply change it in one place should we
   * decide to modify at a later date.
   *
   * @enum {String}
   * @private
   */
MaterialRipple.prototype.CssClasses_ = {
    RIPPLE_CENTER: 'mdl-ripple--center',
    RIPPLE_EFFECT_IGNORE_EVENTS: 'mdl-js-ripple-effect--ignore-events',
    RIPPLE: 'mdl-ripple',
    IS_ANIMATING: 'is-animating',
    IS_VISIBLE: 'is-visible'
};
/**
   * Handle mouse / finger down on element.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialRipple.prototype.downHandler_ = function (event) {
    if (!this.rippleElement_.style.width && !this.rippleElement_.style.height) {
        var rect = this.element_.getBoundingClientRect();
        this.boundHeight = rect.height;
        this.boundWidth = rect.width;
        this.rippleSize_ = Math.sqrt(rect.width * rect.width + rect.height * rect.height) * 2 + 2;
        this.rippleElement_.style.width = this.rippleSize_ + 'px';
        this.rippleElement_.style.height = this.rippleSize_ + 'px';
    }
    this.rippleElement_.classList.add(this.CssClasses_.IS_VISIBLE);
    if (event.type === 'mousedown' && this.ignoringMouseDown_) {
        this.ignoringMouseDown_ = false;
    } else {
        if (event.type === 'touchstart') {
            this.ignoringMouseDown_ = true;
        }
        var frameCount = this.getFrameCount();
        if (frameCount > 0) {
            return;
        }
        this.setFrameCount(1);
        var bound = event.currentTarget.getBoundingClientRect();
        var x;
        var y;
        // Check if we are handling a keyboard click.
        if (event.clientX === 0 && event.clientY === 0) {
            x = Math.round(bound.width / 2);
            y = Math.round(bound.height / 2);
        } else {
            var clientX = event.clientX ? event.clientX : event.touches[0].clientX;
            var clientY = event.clientY ? event.clientY : event.touches[0].clientY;
            x = Math.round(clientX - bound.left);
            y = Math.round(clientY - bound.top);
        }
        this.setRippleXY(x, y);
        this.setRippleStyles(true);
        window.requestAnimationFrame(this.animFrameHandler.bind(this));
    }
};
/**
   * Handle mouse / finger up on element.
   *
   * @param {Event} event The event that fired.
   * @private
   */
MaterialRipple.prototype.upHandler_ = function (event) {
    // Don't fire for the artificial "mouseup" generated by a double-click.
    if (event && event.detail !== 2) {
        this.rippleElement_.classList.remove(this.CssClasses_.IS_VISIBLE);
    }
    // Allow a repaint to occur before removing this class, so the animation
    // shows for tap events, which seem to trigger a mouseup too soon after
    // mousedown.
    window.setTimeout(function () {
        this.rippleElement_.classList.remove(this.CssClasses_.IS_VISIBLE);
    }.bind(this), 0);
};
/**
   * Initialize element.
   */
MaterialRipple.prototype.init = function () {
    if (this.element_) {
        var recentering = this.element_.classList.contains(this.CssClasses_.RIPPLE_CENTER);
        if (!this.element_.classList.contains(this.CssClasses_.RIPPLE_EFFECT_IGNORE_EVENTS)) {
            this.rippleElement_ = this.element_.querySelector('.' + this.CssClasses_.RIPPLE);
            this.frameCount_ = 0;
            this.rippleSize_ = 0;
            this.x_ = 0;
            this.y_ = 0;
            // Touch start produces a compat mouse down event, which would cause a
            // second ripples. To avoid that, we use this property to ignore the first
            // mouse down after a touch start.
            this.ignoringMouseDown_ = false;
            this.boundDownHandler = this.downHandler_.bind(this);
            this.element_.addEventListener('mousedown', this.boundDownHandler);
            this.element_.addEventListener('touchstart', this.boundDownHandler);
            this.boundUpHandler = this.upHandler_.bind(this);
            this.element_.addEventListener('mouseup', this.boundUpHandler);
            this.element_.addEventListener('mouseleave', this.boundUpHandler);
            this.element_.addEventListener('touchend', this.boundUpHandler);
            this.element_.addEventListener('blur', this.boundUpHandler);
            this.getFrameCount = function () {
                return this.frameCount_;
            };
            this.setFrameCount = function (fC) {
                this.frameCount_ = fC;
            };
            this.getRippleElement = function () {
                return this.rippleElement_;
            };
            this.setRippleXY = function (newX, newY) {
                this.x_ = newX;
                this.y_ = newY;
            };
            this.setRippleStyles = function (start) {
                if (this.rippleElement_ !== null) {
                    var transformString;
                    var scale;
                    var size;
                    var offset = 'translate(' + this.x_ + 'px, ' + this.y_ + 'px)';
                    if (start) {
                        scale = this.Constant_.INITIAL_SCALE;
                        size = this.Constant_.INITIAL_SIZE;
                    } else {
                        scale = this.Constant_.FINAL_SCALE;
                        size = this.rippleSize_ + 'px';
                        if (recentering) {
                            offset = 'translate(' + this.boundWidth / 2 + 'px, ' + this.boundHeight / 2 + 'px)';
                        }
                    }
                    transformString = 'translate(-50%, -50%) ' + offset + scale;
                    this.rippleElement_.style.webkitTransform = transformString;
                    this.rippleElement_.style.msTransform = transformString;
                    this.rippleElement_.style.transform = transformString;
                    if (start) {
                        this.rippleElement_.classList.remove(this.CssClasses_.IS_ANIMATING);
                    } else {
                        this.rippleElement_.classList.add(this.CssClasses_.IS_ANIMATING);
                    }
                }
            };
            this.animFrameHandler = function () {
                if (this.frameCount_-- > 0) {
                    window.requestAnimationFrame(this.animFrameHandler.bind(this));
                } else {
                    this.setRippleStyles(false);
                }
            };
        }
    }
};
/**
   * Downgrade the component
   *
   * @private
   */
MaterialRipple.prototype.mdlDowngrade_ = function () {
    this.element_.removeEventListener('mousedown', this.boundDownHandler);
    this.element_.removeEventListener('touchstart', this.boundDownHandler);
    this.element_.removeEventListener('mouseup', this.boundUpHandler);
    this.element_.removeEventListener('mouseleave', this.boundUpHandler);
    this.element_.removeEventListener('touchend', this.boundUpHandler);
    this.element_.removeEventListener('blur', this.boundUpHandler);
};
// The component registers itself. It can assume componentHandler is available
// in the global scope.
componentHandler.register({
    constructor: MaterialRipple,
    classAsString: 'MaterialRipple',
    cssClass: 'mdl-js-ripple-effect',
    widget: false
});
}());

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = '.mdl-button{background:0 0;border:none;border-radius:2px;color:#000;position:relative;height:36px;min-width:64px;padding:0 8px;display:inline-block;font-family:"Roboto","Helvetica","Arial",sans-serif;font-size:14px;font-weight:500;text-transform:uppercase;letter-spacing:0;overflow:hidden;will-change:box-shadow,transform;-webkit-transition:box-shadow .2s cubic-bezier(.4,0,1,1),background-color .2s cubic-bezier(.4,0,.2,1),color .2s cubic-bezier(.4,0,.2,1);transition:box-shadow .2s cubic-bezier(.4,0,1,1),background-color .2s cubic-bezier(.4,0,.2,1),color .2s cubic-bezier(.4,0,.2,1);outline:none;cursor:pointer;text-decoration:none;text-align:center;line-height:36px;vertical-align:middle}.mdl-button::-moz-focus-inner{border:0}.mdl-button:hover{background-color:rgba(158,158,158,.2)}.mdl-button:focus:not(:active){background-color:rgba(0,0,0,.12)}.mdl-button:active{background-color:rgba(158,158,158,.4)}.mdl-button.mdl-button--colored{color:#3f51b5}.mdl-button.mdl-button--colored:focus:not(:active){background-color:rgba(0,0,0,.12)}input.mdl-button[type="submit"]{-webkit-appearance:none}.mdl-button--raised{background:rgba(158,158,158,.2);box-shadow:0 2px 2px 0 rgba(0,0,0,.14),0 3px 1px -2px rgba(0,0,0,.2),0 1px 5px 0 rgba(0,0,0,.12)}.mdl-button--raised:active{box-shadow:0 4px 5px 0 rgba(0,0,0,.14),0 1px 10px 0 rgba(0,0,0,.12),0 2px 4px -1px rgba(0,0,0,.2);background-color:rgba(158,158,158,.4)}.mdl-button--raised:focus:not(:active){box-shadow:0 0 8px rgba(0,0,0,.18),0 8px 16px rgba(0,0,0,.36);background-color:rgba(158,158,158,.4)}.mdl-button--raised.mdl-button--colored{background:#3f51b5;color:#fff}.mdl-button--raised.mdl-button--colored:hover{background-color:#3f51b5}.mdl-button--raised.mdl-button--colored:active{background-color:#3f51b5}.mdl-button--raised.mdl-button--colored:focus:not(:active){background-color:#3f51b5}.mdl-button--raised.mdl-button--colored .mdl-ripple{background:#fff}.mdl-button--fab{border-radius:50%;font-size:24px;height:56px;margin:auto;min-width:56px;width:56px;padding:0;overflow:hidden;background:rgba(158,158,158,.2);box-shadow:0 1px 1.5px 0 rgba(0,0,0,.12),0 1px 1px 0 rgba(0,0,0,.24);position:relative;line-height:normal}.mdl-button--fab .material-icons{position:absolute;top:50%;left:50%;-webkit-transform:translate(-12px,-12px);-ms-transform:translate(-12px,-12px);transform:translate(-12px,-12px);line-height:24px;width:24px}.mdl-button--fab.mdl-button--mini-fab{height:40px;min-width:40px;width:40px}.mdl-button--fab .mdl-button__ripple-container{border-radius:50%;-webkit-mask-image:-webkit-radial-gradient(circle,#fff,#000)}.mdl-button--fab:active{box-shadow:0 4px 5px 0 rgba(0,0,0,.14),0 1px 10px 0 rgba(0,0,0,.12),0 2px 4px -1px rgba(0,0,0,.2);background-color:rgba(158,158,158,.4)}.mdl-button--fab:focus:not(:active){box-shadow:0 0 8px rgba(0,0,0,.18),0 8px 16px rgba(0,0,0,.36);background-color:rgba(158,158,158,.4)}.mdl-button--fab.mdl-button--colored{background:#ff4081;color:#fff}.mdl-button--fab.mdl-button--colored:hover{background-color:#ff4081}.mdl-button--fab.mdl-button--colored:focus:not(:active){background-color:#ff4081}.mdl-button--fab.mdl-button--colored:active{background-color:#ff4081}.mdl-button--fab.mdl-button--colored .mdl-ripple{background:#fff}.mdl-button--icon{border-radius:50%;font-size:24px;height:32px;margin-left:0;margin-right:0;min-width:32px;width:32px;padding:0;overflow:hidden;color:inherit;line-height:normal}.mdl-button--icon .material-icons{position:absolute;top:50%;left:50%;-webkit-transform:translate(-12px,-12px);-ms-transform:translate(-12px,-12px);transform:translate(-12px,-12px);line-height:24px;width:24px}.mdl-button--icon.mdl-button--mini-icon{height:24px;min-width:24px;width:24px}.mdl-button--icon.mdl-button--mini-icon .material-icons{top:0;left:0}.mdl-button--icon .mdl-button__ripple-container{border-radius:50%;-webkit-mask-image:-webkit-radial-gradient(circle,#fff,#000)}.mdl-button__ripple-container{display:block;height:100%;left:0;position:absolute;top:0;width:100%;z-index:0;overflow:hidden}.mdl-button[disabled] .mdl-button__ripple-container .mdl-ripple,.mdl-button.mdl-button--disabled .mdl-button__ripple-container .mdl-ripple{background-color:transparent}.mdl-button--primary.mdl-button--primary{color:#3f51b5}.mdl-button--primary.mdl-button--primary .mdl-ripple{background:#fff}.mdl-button--primary.mdl-button--primary.mdl-button--raised,.mdl-button--primary.mdl-button--primary.mdl-button--fab{color:#fff;background-color:#3f51b5}.mdl-button--accent.mdl-button--accent{color:#ff4081}.mdl-button--accent.mdl-button--accent .mdl-ripple{background:#fff}.mdl-button--accent.mdl-button--accent.mdl-button--raised,.mdl-button--accent.mdl-button--accent.mdl-button--fab{color:#fff;background-color:#ff4081}.mdl-button[disabled][disabled],.mdl-button.mdl-button--disabled.mdl-button--disabled{color:rgba(0,0,0,.26);cursor:auto;background-color:transparent}.mdl-button--fab[disabled][disabled],.mdl-button--fab.mdl-button--disabled.mdl-button--disabled,.mdl-button--raised[disabled][disabled],.mdl-button--raised.mdl-button--disabled.mdl-button--disabled{background-color:rgba(0,0,0,.12);color:rgba(0,0,0,.26);box-shadow:0 2px 2px 0 rgba(0,0,0,.14),0 3px 1px -2px rgba(0,0,0,.2),0 1px 5px 0 rgba(0,0,0,.12)}.mdl-button--colored[disabled][disabled],.mdl-button--colored.mdl-button--disabled.mdl-button--disabled{color:rgba(0,0,0,.26)}.mdl-button .material-icons{vertical-align:middle}';
module.exports = exports['default'];

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = '.mdl-ripple{background:#000;border-radius:50%;height:50px;left:0;opacity:0;pointer-events:none;position:absolute;top:0;-webkit-transform:translate(-50%,-50%);-ms-transform:translate(-50%,-50%);transform:translate(-50%,-50%);width:50px;overflow:hidden}.mdl-ripple.is-animating{-webkit-transition:-webkit-transform .3s cubic-bezier(0,0,.2,1),width .3s cubic-bezier(0,0,.2,1),height .3s cubic-bezier(0,0,.2,1),opacity .6s cubic-bezier(0,0,.2,1);transition:transform .3s cubic-bezier(0,0,.2,1),width .3s cubic-bezier(0,0,.2,1),height .3s cubic-bezier(0,0,.2,1),opacity .6s cubic-bezier(0,0,.2,1)}.mdl-ripple.is-visible{opacity:.3}';
module.exports = exports['default'];

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = '.mdl-textfield{position:relative;font-size:16px;display:inline-block;box-sizing:border-box;width:300px;max-width:100%;margin:0;padding:20px 0}.mdl-textfield .mdl-button{position:absolute;bottom:20px}.mdl-textfield--align-right{text-align:right}.mdl-textfield--full-width{width:100%}.mdl-textfield--expandable{min-width:32px;width:auto;min-height:32px}.mdl-textfield__input{border:none;border-bottom:1px solid rgba(0,0,0,.12);display:block;font-size:16px;margin:0;padding:4px 0;width:100%;background:0 0;text-align:left;color:inherit}.mdl-textfield.is-focused .mdl-textfield__input{outline:none}.mdl-textfield.is-invalid .mdl-textfield__input{border-color:#de3226;box-shadow:none}.mdl-textfield.is-disabled .mdl-textfield__input{background-color:transparent;border-bottom:1px dotted rgba(0,0,0,.12);color:rgba(0,0,0,.26)}.mdl-textfield textarea.mdl-textfield__input{display:block}.mdl-textfield__label{bottom:0;color:rgba(0,0,0,.26);font-size:16px;left:0;right:0;pointer-events:none;position:absolute;display:block;top:24px;width:100%;overflow:hidden;white-space:nowrap;text-align:left}.mdl-textfield.is-dirty .mdl-textfield__label{visibility:hidden}.mdl-textfield--floating-label .mdl-textfield__label{-webkit-transition-duration:.2s;transition-duration:.2s;-webkit-transition-timing-function:cubic-bezier(.4,0,.2,1);transition-timing-function:cubic-bezier(.4,0,.2,1)}.mdl-textfield.is-disabled.is-disabled .mdl-textfield__label{color:rgba(0,0,0,.26)}.mdl-textfield--floating-label.is-focused .mdl-textfield__label,.mdl-textfield--floating-label.is-dirty .mdl-textfield__label{color:#3f51b5;font-size:12px;top:4px;visibility:visible}.mdl-textfield--floating-label.is-focused .mdl-textfield__expandable-holder .mdl-textfield__label,.mdl-textfield--floating-label.is-dirty .mdl-textfield__expandable-holder .mdl-textfield__label{top:-16px}.mdl-textfield--floating-label.is-invalid .mdl-textfield__label{color:#de3226;font-size:12px}.mdl-textfield__label:after{background-color:#3f51b5;bottom:20px;content:\'\';height:2px;left:45%;position:absolute;-webkit-transition-duration:.2s;transition-duration:.2s;-webkit-transition-timing-function:cubic-bezier(.4,0,.2,1);transition-timing-function:cubic-bezier(.4,0,.2,1);visibility:hidden;width:10px}.mdl-textfield.is-focused .mdl-textfield__label:after{left:0;visibility:visible;width:100%}.mdl-textfield.is-invalid .mdl-textfield__label:after{background-color:#de3226}.mdl-textfield__error{color:#de3226;position:absolute;font-size:12px;margin-top:3px;visibility:hidden;display:block}.mdl-textfield.is-invalid .mdl-textfield__error{visibility:visible}.mdl-textfield__expandable-holder{display:inline-block;position:relative;margin-left:32px;-webkit-transition-duration:.2s;transition-duration:.2s;-webkit-transition-timing-function:cubic-bezier(.4,0,.2,1);transition-timing-function:cubic-bezier(.4,0,.2,1);display:inline-block;max-width:.1px}.mdl-textfield.is-focused .mdl-textfield__expandable-holder,.mdl-textfield.is-dirty .mdl-textfield__expandable-holder{max-width:600px}.mdl-textfield__expandable-holder .mdl-textfield__label:after{bottom:0}';
module.exports = exports['default'];

},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = '@charset "UTF-8";div{font-family:"Helvetica","Arial",sans-serif;font-size:14px;font-weight:400;line-height:20px}h1,h2,h3,h4,h5,h6,p{padding:0}h1 small,h2 small,h3 small,h4 small,h5 small,h6 small{font-family:"Roboto","Helvetica","Arial",sans-serif;font-weight:400;line-height:1.35;letter-spacing:-.02em;opacity:.54;font-size:.6em}h1{font-size:56px;line-height:1.35;letter-spacing:-.02em;margin:24px 0}h1,h2{font-family:"Roboto","Helvetica","Arial",sans-serif;font-weight:400}h2{font-size:45px;line-height:48px}h2,h3{margin:24px 0}h3{font-size:34px;line-height:40px}h3,h4{font-family:"Roboto","Helvetica","Arial",sans-serif;font-weight:400}h4{font-size:24px;line-height:32px;-moz-osx-font-smoothing:grayscale;margin:24px 0 16px}h5{font-size:20px;font-weight:500;line-height:1;letter-spacing:.02em}h5,h6{font-family:"Roboto","Helvetica","Arial",sans-serif;margin:24px 0 16px}h6{font-size:16px;letter-spacing:.04em}h6,p{font-weight:400;line-height:24px}p{font-size:14px;letter-spacing:0;margin:0 0 16px}a{color:#ff4081;font-weight:500}blockquote{font-family:"Roboto","Helvetica","Arial",sans-serif;position:relative;font-size:24px;font-weight:300;font-style:italic;line-height:1.35;letter-spacing:.08em}blockquote:before{position:absolute;left:-.5em;content:\'“\'}blockquote:after{content:\'”\';margin-left:-.05em}mark{background-color:#f4ff81}dt{font-weight:700}address{font-size:12px;line-height:1;font-style:normal}address,ul,ol{font-weight:400;letter-spacing:0}ul,ol{font-size:14px;line-height:24px}.mdl-typography--display-4,.mdl-typography--display-4-color-contrast{font-family:"Roboto","Helvetica","Arial",sans-serif;font-size:112px;font-weight:300;line-height:1;letter-spacing:-.04em}.mdl-typography--display-4-color-contrast{opacity:.54}.mdl-typography--display-3,.mdl-typography--display-3-color-contrast{font-family:"Roboto","Helvetica","Arial",sans-serif;font-size:56px;font-weight:400;line-height:1.35;letter-spacing:-.02em}.mdl-typography--display-3-color-contrast{opacity:.54}.mdl-typography--display-2,.mdl-typography--display-2-color-contrast{font-family:"Roboto","Helvetica","Arial",sans-serif;font-size:45px;font-weight:400;line-height:48px}.mdl-typography--display-2-color-contrast{opacity:.54}.mdl-typography--display-1,.mdl-typography--display-1-color-contrast{font-family:"Roboto","Helvetica","Arial",sans-serif;font-size:34px;font-weight:400;line-height:40px}.mdl-typography--display-1-color-contrast{opacity:.54}.mdl-typography--headline,.mdl-typography--headline-color-contrast{font-family:"Roboto","Helvetica","Arial",sans-serif;font-size:24px;font-weight:400;line-height:32px;-moz-osx-font-smoothing:grayscale}.mdl-typography--headline-color-contrast{opacity:.87}.mdl-typography--title,.mdl-typography--title-color-contrast{font-family:"Roboto","Helvetica","Arial",sans-serif;font-size:20px;font-weight:500;line-height:1;letter-spacing:.02em}.mdl-typography--title-color-contrast{opacity:.87}.mdl-typography--subhead,.mdl-typography--subhead-color-contrast{font-family:"Roboto","Helvetica","Arial",sans-serif;font-size:16px;font-weight:400;line-height:24px;letter-spacing:.04em}.mdl-typography--subhead-color-contrast{opacity:.87}.mdl-typography--body-2,.mdl-typography--body-2-color-contrast{font-size:14px;font-weight:700;line-height:24px;letter-spacing:0}.mdl-typography--body-2-color-contrast{opacity:.87}.mdl-typography--body-1,.mdl-typography--body-1-color-contrast{font-size:14px;font-weight:400;line-height:24px;letter-spacing:0}.mdl-typography--body-1-color-contrast{opacity:.87}.mdl-typography--body-2-force-preferred-font,.mdl-typography--body-2-force-preferred-font-color-contrast{font-family:"Roboto","Helvetica","Arial",sans-serif;font-size:14px;font-weight:500;line-height:24px;letter-spacing:0}.mdl-typography--body-2-force-preferred-font-color-contrast{opacity:.87}.mdl-typography--body-1-force-preferred-font,.mdl-typography--body-1-force-preferred-font-color-contrast{font-family:"Roboto","Helvetica","Arial",sans-serif;font-size:14px;font-weight:400;line-height:24px;letter-spacing:0}.mdl-typography--body-1-force-preferred-font-color-contrast{opacity:.87}.mdl-typography--caption,.mdl-typography--caption-force-preferred-font{font-size:12px;font-weight:400;line-height:1;letter-spacing:0}.mdl-typography--caption-force-preferred-font{font-family:"Roboto","Helvetica","Arial",sans-serif}.mdl-typography--caption-color-contrast,.mdl-typography--caption-force-preferred-font-color-contrast{font-size:12px;font-weight:400;line-height:1;letter-spacing:0;opacity:.54}.mdl-typography--caption-force-preferred-font-color-contrast,.mdl-typography--menu{font-family:"Roboto","Helvetica","Arial",sans-serif}.mdl-typography--menu{font-size:14px;font-weight:500;line-height:1;letter-spacing:0}.mdl-typography--menu-color-contrast{opacity:.87}.mdl-typography--menu-color-contrast,.mdl-typography--button,.mdl-typography--button-color-contrast{font-family:"Roboto","Helvetica","Arial",sans-serif;font-size:14px;font-weight:500;line-height:1;letter-spacing:0}.mdl-typography--button,.mdl-typography--button-color-contrast{text-transform:uppercase}.mdl-typography--button-color-contrast{opacity:.87}.mdl-typography--text-left{text-align:left}.mdl-typography--text-right{text-align:right}.mdl-typography--text-center{text-align:center}.mdl-typography--text-justify{text-align:justify}.mdl-typography--text-nowrap{white-space:nowrap}.mdl-typography--text-lowercase{text-transform:lowercase}.mdl-typography--text-uppercase{text-transform:uppercase}.mdl-typography--text-capitalize{text-transform:capitalize}.mdl-typography--font-thin{font-weight:200!important}.mdl-typography--font-light{font-weight:300!important}.mdl-typography--font-regular{font-weight:400!important}.mdl-typography--font-medium{font-weight:500!important}.mdl-typography--font-bold{font-weight:700!important}.mdl-typography--font-black{font-weight:900!important}';
module.exports = exports['default'];

},{}],5:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _materialButton = require('./material-button');

var _materialButton2 = _interopRequireDefault(_materialButton);

var _materialInput = require('./material-input');

var _materialInput2 = _interopRequireDefault(_materialInput);

(0, _materialButton2['default'])();
(0, _materialInput2['default'])();

},{"./material-button":6,"./material-input":7}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _register = require('./register');

var _cssjsButtonCss = require('./cssjs/button.css');

var _cssjsButtonCss2 = _interopRequireDefault(_cssjsButtonCss);

var _cssjsRippleCss = require('./cssjs/ripple.css');

var _cssjsRippleCss2 = _interopRequireDefault(_cssjsRippleCss);

exports['default'] = function () {
  (0, _register.defineComponent)('material-button', {
    mdlEl: 'button',
    createShadowDOM: function createShadowDOM() {
      var className = "mdl-button mdl-js-button mdl-button--accent";
      if (this.hasAttribute('raised')) {
        className += " mdl-button--raised";
      }
      if (!this.hasAttribute('noink')) {
        className += " mdl-js-ripple-effect";
      }
      this.createShadowRoot().innerHTML = '<style>' + _cssjsButtonCss2['default'] + _cssjsRippleCss2['default'] + '</style>' + '<button class="' + className + '"><content></content></button>';
    }
  });
};

;
module.exports = exports['default'];

},{"./cssjs/button.css":1,"./cssjs/ripple.css":2,"./register":8}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _register = require('./register');

var _cssjsTextfieldCss = require('./cssjs/textfield.css');

var _cssjsTextfieldCss2 = _interopRequireDefault(_cssjsTextfieldCss);

var _cssjsTypographyCss = require('./cssjs/typography.css');

var _cssjsTypographyCss2 = _interopRequireDefault(_cssjsTypographyCss);

exports['default'] = function () {
  (0, _register.defineComponent)('material-input', {
    mdlEl: '.mdl-textfield',
    createShadowDOM: function createShadowDOM() {
      var label = this.getAttribute('label') || 'Text...',
          labelFloat = this.hasAttribute('floating-label') ? ' mdl-textfield--floating-label' : '',
          pattern = this.getAttribute('pattern'),
          error = this.getAttribute('error'),
          patternHTML = pattern ? ' pattern="' + pattern + '"' : '',
          errorHTML = error ? '<span class="mdl-textfield__error">' + error + '</span>' : '';

      this.createShadowRoot().innerHTML = '<style>' + _cssjsTextfieldCss2['default'] + _cssjsTypographyCss2['default'] + '</style>' + '<div class="mdl-textfield mdl-js-textfield' + labelFloat + '">' + '<input class="mdl-textfield__input" type="text" id="mdl-input1"' + patternHTML + '/>' + '<label class="mdl-textfield__label" for="mdl-input1">' + label + '</label>' + errorHTML + '</div>';
    },
    proto: {
      value: {
        get: function get() {
          return this.shadowRoot.querySelector('.mdl-textfield__input').value;
        }
      }
    }
  });
};

;
module.exports = exports['default'];

},{"./cssjs/textfield.css":3,"./cssjs/typography.css":4,"./register":8}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defineComponent = defineComponent;

function defineComponent(componentName, componentDef) {
  var componentProto = Object.create(HTMLElement.prototype, {
    createdCallback: {
      value: function value() {
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
  document.registerElement(componentName, { prototype: componentProto });
}

;

},{}]},{},[5])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS90ZWQvd29ya3NwYWNlL21kbC13ZWJjb21wb25lbnRzL3NyYy9jc3Nqcy9idXR0b24uY3NzLmpzIiwiL2hvbWUvdGVkL3dvcmtzcGFjZS9tZGwtd2ViY29tcG9uZW50cy9zcmMvY3NzanMvcmlwcGxlLmNzcy5qcyIsIi9ob21lL3RlZC93b3Jrc3BhY2UvbWRsLXdlYmNvbXBvbmVudHMvc3JjL2Nzc2pzL3RleHRmaWVsZC5jc3MuanMiLCIvaG9tZS90ZWQvd29ya3NwYWNlL21kbC13ZWJjb21wb25lbnRzL3NyYy9jc3Nqcy90eXBvZ3JhcGh5LmNzcy5qcyIsIi9ob21lL3RlZC93b3Jrc3BhY2UvbWRsLXdlYmNvbXBvbmVudHMvc3JjL2luZGV4LmpzIiwiL2hvbWUvdGVkL3dvcmtzcGFjZS9tZGwtd2ViY29tcG9uZW50cy9zcmMvbWF0ZXJpYWwtYnV0dG9uLmpzIiwiL2hvbWUvdGVkL3dvcmtzcGFjZS9tZGwtd2ViY29tcG9uZW50cy9zcmMvbWF0ZXJpYWwtaW5wdXQuanMiLCIvaG9tZS90ZWQvd29ya3NwYWNlL21kbC13ZWJjb21wb25lbnRzL3NyYy9yZWdpc3Rlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O3FCQ0FlLDJ4S0FBMnhLOzs7Ozs7Ozs7cUJDQTN4SyxvbkJBQW9uQjs7Ozs7Ozs7O3FCQ0FwbkIscWhHQUFxaEc7Ozs7Ozs7OztxQkNBcmhHLG91TEFBb3VMOzs7Ozs7Ozs4QkNBeHRMLG1CQUFtQjs7Ozs2QkFDbkIsa0JBQWtCOzs7O0FBRTdDLGtDQUFnQixDQUFDO0FBQ2pCLGlDQUFlLENBQUM7Ozs7Ozs7Ozs7O3dCQ0pjLFlBQVk7OzhCQUNuQixvQkFBb0I7Ozs7OEJBQ3BCLG9CQUFvQjs7OztxQkFFNUIsWUFBVztBQUN4QixpQ0FBZ0IsaUJBQWlCLEVBQUU7QUFDakMsU0FBSyxFQUFFLFFBQVE7QUFDZixtQkFBZSxFQUFFLDJCQUFXO0FBQzFCLFVBQUksU0FBUyxHQUFHLDZDQUE2QyxDQUFDO0FBQzlELFVBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUMvQixpQkFBUyxJQUFJLHFCQUFxQixDQUFDO09BQ3BDO0FBQ0QsVUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDL0IsaUJBQVMsSUFBSSx1QkFBdUIsQ0FBQztPQUN0QztBQUNELFVBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLFNBQVMsR0FDL0IsU0FBUyw4QkFBYSw4QkFBYSxHQUFHLFVBQVUsR0FDaEQsaUJBQWlCLEdBQUcsU0FBUyxHQUFHLGdDQUFnQyxDQUFDO0tBQ3BFO0dBQ0YsQ0FBQyxDQUFDO0NBQ0o7O0FBQUEsQ0FBQzs7Ozs7Ozs7Ozs7O3dCQ3BCNEIsWUFBWTs7aUNBQ2hCLHVCQUF1Qjs7OztrQ0FDdEIsd0JBQXdCOzs7O3FCQUVwQyxZQUFXO0FBQ3hCLGlDQUFnQixnQkFBZ0IsRUFBRTtBQUNoQyxTQUFLLEVBQUUsZ0JBQWdCO0FBQ3ZCLG1CQUFlLEVBQUUsMkJBQVc7QUFDMUIsVUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxTQUFTO1VBQy9DLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsZ0NBQWdDLEdBQUcsRUFBRTtVQUN4RixPQUFPLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUM7VUFDdEMsS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDO1VBQ2xDLFdBQVcsR0FBRyxPQUFPLEdBQUcsWUFBWSxHQUFHLE9BQU8sR0FBRyxHQUFHLEdBQUcsRUFBRTtVQUN6RCxTQUFTLEdBQUcsS0FBSyxHQUFHLHFDQUFxQyxHQUFHLEtBQUssR0FBRyxTQUFTLEdBQUcsRUFBRSxDQUFDOztBQUV2RixVQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxTQUFTLEdBQy9CLFNBQVMsaUNBQWdCLGtDQUFpQixHQUFHLFVBQVUsR0FDdkQsNENBQTRDLEdBQUcsVUFBVSxHQUFHLElBQUksR0FDOUQsaUVBQWlFLEdBQUUsV0FBVyxHQUFHLElBQUksR0FDckYsdURBQXVELEdBQUcsS0FBSyxHQUFHLFVBQVUsR0FDNUUsU0FBUyxHQUNYLFFBQVEsQ0FBQztLQUNaO0FBQ0QsU0FBSyxFQUFFO0FBQ0wsV0FBSyxFQUFFO0FBQ0wsV0FBRyxFQUFFLGVBQVc7QUFDZCxpQkFBTyxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLEtBQUssQ0FBQztTQUNyRTtPQUNGO0tBQ0Y7R0FDRixDQUFDLENBQUM7Q0FDSjs7QUFBQSxDQUFDOzs7Ozs7Ozs7OztBQy9CSyxTQUFTLGVBQWUsQ0FBQyxhQUFhLEVBQUUsWUFBWSxFQUFFO0FBQzNELE1BQUksY0FBYyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRTtBQUN4RCxtQkFBZSxFQUFFO0FBQ2YsV0FBSyxFQUFFLGlCQUFXO0FBQ2hCLG9CQUFZLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN4QyxjQUFNLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO09BQzNGO0tBQ0Y7R0FDRixDQUFDLENBQUM7QUFDSCxNQUFJLFVBQVUsR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDO0FBQ3BDLE1BQUksVUFBVSxFQUFFO0FBQ2QsU0FBSyxJQUFJLFFBQVEsSUFBSSxVQUFVLEVBQUU7QUFDL0IsVUFBSSxVQUFVLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQ3ZDLGNBQU0sQ0FBQyxjQUFjLENBQUMsY0FBYyxFQUFFLFFBQVEsRUFBRSxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztPQUN2RTtLQUNGO0dBQ0Y7QUFDRCxVQUFRLENBQUMsZUFBZSxDQUFDLGFBQWEsRUFBRSxFQUFDLFNBQVMsRUFBRSxjQUFjLEVBQUMsQ0FBQyxDQUFDO0NBQ3RFOztBQUFBLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZXhwb3J0IGRlZmF1bHQgJy5tZGwtYnV0dG9ue2JhY2tncm91bmQ6MCAwO2JvcmRlcjpub25lO2JvcmRlci1yYWRpdXM6MnB4O2NvbG9yOiMwMDA7cG9zaXRpb246cmVsYXRpdmU7aGVpZ2h0OjM2cHg7bWluLXdpZHRoOjY0cHg7cGFkZGluZzowIDhweDtkaXNwbGF5OmlubGluZS1ibG9jaztmb250LWZhbWlseTpcIlJvYm90b1wiLFwiSGVsdmV0aWNhXCIsXCJBcmlhbFwiLHNhbnMtc2VyaWY7Zm9udC1zaXplOjE0cHg7Zm9udC13ZWlnaHQ6NTAwO3RleHQtdHJhbnNmb3JtOnVwcGVyY2FzZTtsZXR0ZXItc3BhY2luZzowO292ZXJmbG93OmhpZGRlbjt3aWxsLWNoYW5nZTpib3gtc2hhZG93LHRyYW5zZm9ybTstd2Via2l0LXRyYW5zaXRpb246Ym94LXNoYWRvdyAuMnMgY3ViaWMtYmV6aWVyKC40LDAsMSwxKSxiYWNrZ3JvdW5kLWNvbG9yIC4ycyBjdWJpYy1iZXppZXIoLjQsMCwuMiwxKSxjb2xvciAuMnMgY3ViaWMtYmV6aWVyKC40LDAsLjIsMSk7dHJhbnNpdGlvbjpib3gtc2hhZG93IC4ycyBjdWJpYy1iZXppZXIoLjQsMCwxLDEpLGJhY2tncm91bmQtY29sb3IgLjJzIGN1YmljLWJlemllciguNCwwLC4yLDEpLGNvbG9yIC4ycyBjdWJpYy1iZXppZXIoLjQsMCwuMiwxKTtvdXRsaW5lOm5vbmU7Y3Vyc29yOnBvaW50ZXI7dGV4dC1kZWNvcmF0aW9uOm5vbmU7dGV4dC1hbGlnbjpjZW50ZXI7bGluZS1oZWlnaHQ6MzZweDt2ZXJ0aWNhbC1hbGlnbjptaWRkbGV9Lm1kbC1idXR0b246Oi1tb3otZm9jdXMtaW5uZXJ7Ym9yZGVyOjB9Lm1kbC1idXR0b246aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDE1OCwxNTgsMTU4LC4yKX0ubWRsLWJ1dHRvbjpmb2N1czpub3QoOmFjdGl2ZSl7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDAsMCwwLC4xMil9Lm1kbC1idXR0b246YWN0aXZle2JhY2tncm91bmQtY29sb3I6cmdiYSgxNTgsMTU4LDE1OCwuNCl9Lm1kbC1idXR0b24ubWRsLWJ1dHRvbi0tY29sb3JlZHtjb2xvcjojM2Y1MWI1fS5tZGwtYnV0dG9uLm1kbC1idXR0b24tLWNvbG9yZWQ6Zm9jdXM6bm90KDphY3RpdmUpe2JhY2tncm91bmQtY29sb3I6cmdiYSgwLDAsMCwuMTIpfWlucHV0Lm1kbC1idXR0b25bdHlwZT1cInN1Ym1pdFwiXXstd2Via2l0LWFwcGVhcmFuY2U6bm9uZX0ubWRsLWJ1dHRvbi0tcmFpc2Vke2JhY2tncm91bmQ6cmdiYSgxNTgsMTU4LDE1OCwuMik7Ym94LXNoYWRvdzowIDJweCAycHggMCByZ2JhKDAsMCwwLC4xNCksMCAzcHggMXB4IC0ycHggcmdiYSgwLDAsMCwuMiksMCAxcHggNXB4IDAgcmdiYSgwLDAsMCwuMTIpfS5tZGwtYnV0dG9uLS1yYWlzZWQ6YWN0aXZle2JveC1zaGFkb3c6MCA0cHggNXB4IDAgcmdiYSgwLDAsMCwuMTQpLDAgMXB4IDEwcHggMCByZ2JhKDAsMCwwLC4xMiksMCAycHggNHB4IC0xcHggcmdiYSgwLDAsMCwuMik7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDE1OCwxNTgsMTU4LC40KX0ubWRsLWJ1dHRvbi0tcmFpc2VkOmZvY3VzOm5vdCg6YWN0aXZlKXtib3gtc2hhZG93OjAgMCA4cHggcmdiYSgwLDAsMCwuMTgpLDAgOHB4IDE2cHggcmdiYSgwLDAsMCwuMzYpO2JhY2tncm91bmQtY29sb3I6cmdiYSgxNTgsMTU4LDE1OCwuNCl9Lm1kbC1idXR0b24tLXJhaXNlZC5tZGwtYnV0dG9uLS1jb2xvcmVke2JhY2tncm91bmQ6IzNmNTFiNTtjb2xvcjojZmZmfS5tZGwtYnV0dG9uLS1yYWlzZWQubWRsLWJ1dHRvbi0tY29sb3JlZDpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiMzZjUxYjV9Lm1kbC1idXR0b24tLXJhaXNlZC5tZGwtYnV0dG9uLS1jb2xvcmVkOmFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOiMzZjUxYjV9Lm1kbC1idXR0b24tLXJhaXNlZC5tZGwtYnV0dG9uLS1jb2xvcmVkOmZvY3VzOm5vdCg6YWN0aXZlKXtiYWNrZ3JvdW5kLWNvbG9yOiMzZjUxYjV9Lm1kbC1idXR0b24tLXJhaXNlZC5tZGwtYnV0dG9uLS1jb2xvcmVkIC5tZGwtcmlwcGxle2JhY2tncm91bmQ6I2ZmZn0ubWRsLWJ1dHRvbi0tZmFie2JvcmRlci1yYWRpdXM6NTAlO2ZvbnQtc2l6ZToyNHB4O2hlaWdodDo1NnB4O21hcmdpbjphdXRvO21pbi13aWR0aDo1NnB4O3dpZHRoOjU2cHg7cGFkZGluZzowO292ZXJmbG93OmhpZGRlbjtiYWNrZ3JvdW5kOnJnYmEoMTU4LDE1OCwxNTgsLjIpO2JveC1zaGFkb3c6MCAxcHggMS41cHggMCByZ2JhKDAsMCwwLC4xMiksMCAxcHggMXB4IDAgcmdiYSgwLDAsMCwuMjQpO3Bvc2l0aW9uOnJlbGF0aXZlO2xpbmUtaGVpZ2h0Om5vcm1hbH0ubWRsLWJ1dHRvbi0tZmFiIC5tYXRlcmlhbC1pY29uc3twb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2xlZnQ6NTAlOy13ZWJraXQtdHJhbnNmb3JtOnRyYW5zbGF0ZSgtMTJweCwtMTJweCk7LW1zLXRyYW5zZm9ybTp0cmFuc2xhdGUoLTEycHgsLTEycHgpO3RyYW5zZm9ybTp0cmFuc2xhdGUoLTEycHgsLTEycHgpO2xpbmUtaGVpZ2h0OjI0cHg7d2lkdGg6MjRweH0ubWRsLWJ1dHRvbi0tZmFiLm1kbC1idXR0b24tLW1pbmktZmFie2hlaWdodDo0MHB4O21pbi13aWR0aDo0MHB4O3dpZHRoOjQwcHh9Lm1kbC1idXR0b24tLWZhYiAubWRsLWJ1dHRvbl9fcmlwcGxlLWNvbnRhaW5lcntib3JkZXItcmFkaXVzOjUwJTstd2Via2l0LW1hc2staW1hZ2U6LXdlYmtpdC1yYWRpYWwtZ3JhZGllbnQoY2lyY2xlLCNmZmYsIzAwMCl9Lm1kbC1idXR0b24tLWZhYjphY3RpdmV7Ym94LXNoYWRvdzowIDRweCA1cHggMCByZ2JhKDAsMCwwLC4xNCksMCAxcHggMTBweCAwIHJnYmEoMCwwLDAsLjEyKSwwIDJweCA0cHggLTFweCByZ2JhKDAsMCwwLC4yKTtiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTU4LDE1OCwxNTgsLjQpfS5tZGwtYnV0dG9uLS1mYWI6Zm9jdXM6bm90KDphY3RpdmUpe2JveC1zaGFkb3c6MCAwIDhweCByZ2JhKDAsMCwwLC4xOCksMCA4cHggMTZweCByZ2JhKDAsMCwwLC4zNik7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDE1OCwxNTgsMTU4LC40KX0ubWRsLWJ1dHRvbi0tZmFiLm1kbC1idXR0b24tLWNvbG9yZWR7YmFja2dyb3VuZDojZmY0MDgxO2NvbG9yOiNmZmZ9Lm1kbC1idXR0b24tLWZhYi5tZGwtYnV0dG9uLS1jb2xvcmVkOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2ZmNDA4MX0ubWRsLWJ1dHRvbi0tZmFiLm1kbC1idXR0b24tLWNvbG9yZWQ6Zm9jdXM6bm90KDphY3RpdmUpe2JhY2tncm91bmQtY29sb3I6I2ZmNDA4MX0ubWRsLWJ1dHRvbi0tZmFiLm1kbC1idXR0b24tLWNvbG9yZWQ6YWN0aXZle2JhY2tncm91bmQtY29sb3I6I2ZmNDA4MX0ubWRsLWJ1dHRvbi0tZmFiLm1kbC1idXR0b24tLWNvbG9yZWQgLm1kbC1yaXBwbGV7YmFja2dyb3VuZDojZmZmfS5tZGwtYnV0dG9uLS1pY29ue2JvcmRlci1yYWRpdXM6NTAlO2ZvbnQtc2l6ZToyNHB4O2hlaWdodDozMnB4O21hcmdpbi1sZWZ0OjA7bWFyZ2luLXJpZ2h0OjA7bWluLXdpZHRoOjMycHg7d2lkdGg6MzJweDtwYWRkaW5nOjA7b3ZlcmZsb3c6aGlkZGVuO2NvbG9yOmluaGVyaXQ7bGluZS1oZWlnaHQ6bm9ybWFsfS5tZGwtYnV0dG9uLS1pY29uIC5tYXRlcmlhbC1pY29uc3twb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2xlZnQ6NTAlOy13ZWJraXQtdHJhbnNmb3JtOnRyYW5zbGF0ZSgtMTJweCwtMTJweCk7LW1zLXRyYW5zZm9ybTp0cmFuc2xhdGUoLTEycHgsLTEycHgpO3RyYW5zZm9ybTp0cmFuc2xhdGUoLTEycHgsLTEycHgpO2xpbmUtaGVpZ2h0OjI0cHg7d2lkdGg6MjRweH0ubWRsLWJ1dHRvbi0taWNvbi5tZGwtYnV0dG9uLS1taW5pLWljb257aGVpZ2h0OjI0cHg7bWluLXdpZHRoOjI0cHg7d2lkdGg6MjRweH0ubWRsLWJ1dHRvbi0taWNvbi5tZGwtYnV0dG9uLS1taW5pLWljb24gLm1hdGVyaWFsLWljb25ze3RvcDowO2xlZnQ6MH0ubWRsLWJ1dHRvbi0taWNvbiAubWRsLWJ1dHRvbl9fcmlwcGxlLWNvbnRhaW5lcntib3JkZXItcmFkaXVzOjUwJTstd2Via2l0LW1hc2staW1hZ2U6LXdlYmtpdC1yYWRpYWwtZ3JhZGllbnQoY2lyY2xlLCNmZmYsIzAwMCl9Lm1kbC1idXR0b25fX3JpcHBsZS1jb250YWluZXJ7ZGlzcGxheTpibG9jaztoZWlnaHQ6MTAwJTtsZWZ0OjA7cG9zaXRpb246YWJzb2x1dGU7dG9wOjA7d2lkdGg6MTAwJTt6LWluZGV4OjA7b3ZlcmZsb3c6aGlkZGVufS5tZGwtYnV0dG9uW2Rpc2FibGVkXSAubWRsLWJ1dHRvbl9fcmlwcGxlLWNvbnRhaW5lciAubWRsLXJpcHBsZSwubWRsLWJ1dHRvbi5tZGwtYnV0dG9uLS1kaXNhYmxlZCAubWRsLWJ1dHRvbl9fcmlwcGxlLWNvbnRhaW5lciAubWRsLXJpcHBsZXtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50fS5tZGwtYnV0dG9uLS1wcmltYXJ5Lm1kbC1idXR0b24tLXByaW1hcnl7Y29sb3I6IzNmNTFiNX0ubWRsLWJ1dHRvbi0tcHJpbWFyeS5tZGwtYnV0dG9uLS1wcmltYXJ5IC5tZGwtcmlwcGxle2JhY2tncm91bmQ6I2ZmZn0ubWRsLWJ1dHRvbi0tcHJpbWFyeS5tZGwtYnV0dG9uLS1wcmltYXJ5Lm1kbC1idXR0b24tLXJhaXNlZCwubWRsLWJ1dHRvbi0tcHJpbWFyeS5tZGwtYnV0dG9uLS1wcmltYXJ5Lm1kbC1idXR0b24tLWZhYntjb2xvcjojZmZmO2JhY2tncm91bmQtY29sb3I6IzNmNTFiNX0ubWRsLWJ1dHRvbi0tYWNjZW50Lm1kbC1idXR0b24tLWFjY2VudHtjb2xvcjojZmY0MDgxfS5tZGwtYnV0dG9uLS1hY2NlbnQubWRsLWJ1dHRvbi0tYWNjZW50IC5tZGwtcmlwcGxle2JhY2tncm91bmQ6I2ZmZn0ubWRsLWJ1dHRvbi0tYWNjZW50Lm1kbC1idXR0b24tLWFjY2VudC5tZGwtYnV0dG9uLS1yYWlzZWQsLm1kbC1idXR0b24tLWFjY2VudC5tZGwtYnV0dG9uLS1hY2NlbnQubWRsLWJ1dHRvbi0tZmFie2NvbG9yOiNmZmY7YmFja2dyb3VuZC1jb2xvcjojZmY0MDgxfS5tZGwtYnV0dG9uW2Rpc2FibGVkXVtkaXNhYmxlZF0sLm1kbC1idXR0b24ubWRsLWJ1dHRvbi0tZGlzYWJsZWQubWRsLWJ1dHRvbi0tZGlzYWJsZWR7Y29sb3I6cmdiYSgwLDAsMCwuMjYpO2N1cnNvcjphdXRvO2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnR9Lm1kbC1idXR0b24tLWZhYltkaXNhYmxlZF1bZGlzYWJsZWRdLC5tZGwtYnV0dG9uLS1mYWIubWRsLWJ1dHRvbi0tZGlzYWJsZWQubWRsLWJ1dHRvbi0tZGlzYWJsZWQsLm1kbC1idXR0b24tLXJhaXNlZFtkaXNhYmxlZF1bZGlzYWJsZWRdLC5tZGwtYnV0dG9uLS1yYWlzZWQubWRsLWJ1dHRvbi0tZGlzYWJsZWQubWRsLWJ1dHRvbi0tZGlzYWJsZWR7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDAsMCwwLC4xMik7Y29sb3I6cmdiYSgwLDAsMCwuMjYpO2JveC1zaGFkb3c6MCAycHggMnB4IDAgcmdiYSgwLDAsMCwuMTQpLDAgM3B4IDFweCAtMnB4IHJnYmEoMCwwLDAsLjIpLDAgMXB4IDVweCAwIHJnYmEoMCwwLDAsLjEyKX0ubWRsLWJ1dHRvbi0tY29sb3JlZFtkaXNhYmxlZF1bZGlzYWJsZWRdLC5tZGwtYnV0dG9uLS1jb2xvcmVkLm1kbC1idXR0b24tLWRpc2FibGVkLm1kbC1idXR0b24tLWRpc2FibGVke2NvbG9yOnJnYmEoMCwwLDAsLjI2KX0ubWRsLWJ1dHRvbiAubWF0ZXJpYWwtaWNvbnN7dmVydGljYWwtYWxpZ246bWlkZGxlfSc7XG4iLCJleHBvcnQgZGVmYXVsdCAnLm1kbC1yaXBwbGV7YmFja2dyb3VuZDojMDAwO2JvcmRlci1yYWRpdXM6NTAlO2hlaWdodDo1MHB4O2xlZnQ6MDtvcGFjaXR5OjA7cG9pbnRlci1ldmVudHM6bm9uZTtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6MDstd2Via2l0LXRyYW5zZm9ybTp0cmFuc2xhdGUoLTUwJSwtNTAlKTstbXMtdHJhbnNmb3JtOnRyYW5zbGF0ZSgtNTAlLC01MCUpO3RyYW5zZm9ybTp0cmFuc2xhdGUoLTUwJSwtNTAlKTt3aWR0aDo1MHB4O292ZXJmbG93OmhpZGRlbn0ubWRsLXJpcHBsZS5pcy1hbmltYXRpbmd7LXdlYmtpdC10cmFuc2l0aW9uOi13ZWJraXQtdHJhbnNmb3JtIC4zcyBjdWJpYy1iZXppZXIoMCwwLC4yLDEpLHdpZHRoIC4zcyBjdWJpYy1iZXppZXIoMCwwLC4yLDEpLGhlaWdodCAuM3MgY3ViaWMtYmV6aWVyKDAsMCwuMiwxKSxvcGFjaXR5IC42cyBjdWJpYy1iZXppZXIoMCwwLC4yLDEpO3RyYW5zaXRpb246dHJhbnNmb3JtIC4zcyBjdWJpYy1iZXppZXIoMCwwLC4yLDEpLHdpZHRoIC4zcyBjdWJpYy1iZXppZXIoMCwwLC4yLDEpLGhlaWdodCAuM3MgY3ViaWMtYmV6aWVyKDAsMCwuMiwxKSxvcGFjaXR5IC42cyBjdWJpYy1iZXppZXIoMCwwLC4yLDEpfS5tZGwtcmlwcGxlLmlzLXZpc2libGV7b3BhY2l0eTouM30nO1xuIiwiZXhwb3J0IGRlZmF1bHQgJy5tZGwtdGV4dGZpZWxke3Bvc2l0aW9uOnJlbGF0aXZlO2ZvbnQtc2l6ZToxNnB4O2Rpc3BsYXk6aW5saW5lLWJsb2NrO2JveC1zaXppbmc6Ym9yZGVyLWJveDt3aWR0aDozMDBweDttYXgtd2lkdGg6MTAwJTttYXJnaW46MDtwYWRkaW5nOjIwcHggMH0ubWRsLXRleHRmaWVsZCAubWRsLWJ1dHRvbntwb3NpdGlvbjphYnNvbHV0ZTtib3R0b206MjBweH0ubWRsLXRleHRmaWVsZC0tYWxpZ24tcmlnaHR7dGV4dC1hbGlnbjpyaWdodH0ubWRsLXRleHRmaWVsZC0tZnVsbC13aWR0aHt3aWR0aDoxMDAlfS5tZGwtdGV4dGZpZWxkLS1leHBhbmRhYmxle21pbi13aWR0aDozMnB4O3dpZHRoOmF1dG87bWluLWhlaWdodDozMnB4fS5tZGwtdGV4dGZpZWxkX19pbnB1dHtib3JkZXI6bm9uZTtib3JkZXItYm90dG9tOjFweCBzb2xpZCByZ2JhKDAsMCwwLC4xMik7ZGlzcGxheTpibG9jaztmb250LXNpemU6MTZweDttYXJnaW46MDtwYWRkaW5nOjRweCAwO3dpZHRoOjEwMCU7YmFja2dyb3VuZDowIDA7dGV4dC1hbGlnbjpsZWZ0O2NvbG9yOmluaGVyaXR9Lm1kbC10ZXh0ZmllbGQuaXMtZm9jdXNlZCAubWRsLXRleHRmaWVsZF9faW5wdXR7b3V0bGluZTpub25lfS5tZGwtdGV4dGZpZWxkLmlzLWludmFsaWQgLm1kbC10ZXh0ZmllbGRfX2lucHV0e2JvcmRlci1jb2xvcjojZGUzMjI2O2JveC1zaGFkb3c6bm9uZX0ubWRsLXRleHRmaWVsZC5pcy1kaXNhYmxlZCAubWRsLXRleHRmaWVsZF9faW5wdXR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItYm90dG9tOjFweCBkb3R0ZWQgcmdiYSgwLDAsMCwuMTIpO2NvbG9yOnJnYmEoMCwwLDAsLjI2KX0ubWRsLXRleHRmaWVsZCB0ZXh0YXJlYS5tZGwtdGV4dGZpZWxkX19pbnB1dHtkaXNwbGF5OmJsb2NrfS5tZGwtdGV4dGZpZWxkX19sYWJlbHtib3R0b206MDtjb2xvcjpyZ2JhKDAsMCwwLC4yNik7Zm9udC1zaXplOjE2cHg7bGVmdDowO3JpZ2h0OjA7cG9pbnRlci1ldmVudHM6bm9uZTtwb3NpdGlvbjphYnNvbHV0ZTtkaXNwbGF5OmJsb2NrO3RvcDoyNHB4O3dpZHRoOjEwMCU7b3ZlcmZsb3c6aGlkZGVuO3doaXRlLXNwYWNlOm5vd3JhcDt0ZXh0LWFsaWduOmxlZnR9Lm1kbC10ZXh0ZmllbGQuaXMtZGlydHkgLm1kbC10ZXh0ZmllbGRfX2xhYmVse3Zpc2liaWxpdHk6aGlkZGVufS5tZGwtdGV4dGZpZWxkLS1mbG9hdGluZy1sYWJlbCAubWRsLXRleHRmaWVsZF9fbGFiZWx7LXdlYmtpdC10cmFuc2l0aW9uLWR1cmF0aW9uOi4yczt0cmFuc2l0aW9uLWR1cmF0aW9uOi4yczstd2Via2l0LXRyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uOmN1YmljLWJlemllciguNCwwLC4yLDEpO3RyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uOmN1YmljLWJlemllciguNCwwLC4yLDEpfS5tZGwtdGV4dGZpZWxkLmlzLWRpc2FibGVkLmlzLWRpc2FibGVkIC5tZGwtdGV4dGZpZWxkX19sYWJlbHtjb2xvcjpyZ2JhKDAsMCwwLC4yNil9Lm1kbC10ZXh0ZmllbGQtLWZsb2F0aW5nLWxhYmVsLmlzLWZvY3VzZWQgLm1kbC10ZXh0ZmllbGRfX2xhYmVsLC5tZGwtdGV4dGZpZWxkLS1mbG9hdGluZy1sYWJlbC5pcy1kaXJ0eSAubWRsLXRleHRmaWVsZF9fbGFiZWx7Y29sb3I6IzNmNTFiNTtmb250LXNpemU6MTJweDt0b3A6NHB4O3Zpc2liaWxpdHk6dmlzaWJsZX0ubWRsLXRleHRmaWVsZC0tZmxvYXRpbmctbGFiZWwuaXMtZm9jdXNlZCAubWRsLXRleHRmaWVsZF9fZXhwYW5kYWJsZS1ob2xkZXIgLm1kbC10ZXh0ZmllbGRfX2xhYmVsLC5tZGwtdGV4dGZpZWxkLS1mbG9hdGluZy1sYWJlbC5pcy1kaXJ0eSAubWRsLXRleHRmaWVsZF9fZXhwYW5kYWJsZS1ob2xkZXIgLm1kbC10ZXh0ZmllbGRfX2xhYmVse3RvcDotMTZweH0ubWRsLXRleHRmaWVsZC0tZmxvYXRpbmctbGFiZWwuaXMtaW52YWxpZCAubWRsLXRleHRmaWVsZF9fbGFiZWx7Y29sb3I6I2RlMzIyNjtmb250LXNpemU6MTJweH0ubWRsLXRleHRmaWVsZF9fbGFiZWw6YWZ0ZXJ7YmFja2dyb3VuZC1jb2xvcjojM2Y1MWI1O2JvdHRvbToyMHB4O2NvbnRlbnQ6XFwnXFwnO2hlaWdodDoycHg7bGVmdDo0NSU7cG9zaXRpb246YWJzb2x1dGU7LXdlYmtpdC10cmFuc2l0aW9uLWR1cmF0aW9uOi4yczt0cmFuc2l0aW9uLWR1cmF0aW9uOi4yczstd2Via2l0LXRyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uOmN1YmljLWJlemllciguNCwwLC4yLDEpO3RyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uOmN1YmljLWJlemllciguNCwwLC4yLDEpO3Zpc2liaWxpdHk6aGlkZGVuO3dpZHRoOjEwcHh9Lm1kbC10ZXh0ZmllbGQuaXMtZm9jdXNlZCAubWRsLXRleHRmaWVsZF9fbGFiZWw6YWZ0ZXJ7bGVmdDowO3Zpc2liaWxpdHk6dmlzaWJsZTt3aWR0aDoxMDAlfS5tZGwtdGV4dGZpZWxkLmlzLWludmFsaWQgLm1kbC10ZXh0ZmllbGRfX2xhYmVsOmFmdGVye2JhY2tncm91bmQtY29sb3I6I2RlMzIyNn0ubWRsLXRleHRmaWVsZF9fZXJyb3J7Y29sb3I6I2RlMzIyNjtwb3NpdGlvbjphYnNvbHV0ZTtmb250LXNpemU6MTJweDttYXJnaW4tdG9wOjNweDt2aXNpYmlsaXR5OmhpZGRlbjtkaXNwbGF5OmJsb2NrfS5tZGwtdGV4dGZpZWxkLmlzLWludmFsaWQgLm1kbC10ZXh0ZmllbGRfX2Vycm9ye3Zpc2liaWxpdHk6dmlzaWJsZX0ubWRsLXRleHRmaWVsZF9fZXhwYW5kYWJsZS1ob2xkZXJ7ZGlzcGxheTppbmxpbmUtYmxvY2s7cG9zaXRpb246cmVsYXRpdmU7bWFyZ2luLWxlZnQ6MzJweDstd2Via2l0LXRyYW5zaXRpb24tZHVyYXRpb246LjJzO3RyYW5zaXRpb24tZHVyYXRpb246LjJzOy13ZWJraXQtdHJhbnNpdGlvbi10aW1pbmctZnVuY3Rpb246Y3ViaWMtYmV6aWVyKC40LDAsLjIsMSk7dHJhbnNpdGlvbi10aW1pbmctZnVuY3Rpb246Y3ViaWMtYmV6aWVyKC40LDAsLjIsMSk7ZGlzcGxheTppbmxpbmUtYmxvY2s7bWF4LXdpZHRoOi4xcHh9Lm1kbC10ZXh0ZmllbGQuaXMtZm9jdXNlZCAubWRsLXRleHRmaWVsZF9fZXhwYW5kYWJsZS1ob2xkZXIsLm1kbC10ZXh0ZmllbGQuaXMtZGlydHkgLm1kbC10ZXh0ZmllbGRfX2V4cGFuZGFibGUtaG9sZGVye21heC13aWR0aDo2MDBweH0ubWRsLXRleHRmaWVsZF9fZXhwYW5kYWJsZS1ob2xkZXIgLm1kbC10ZXh0ZmllbGRfX2xhYmVsOmFmdGVye2JvdHRvbTowfSc7XG4iLCJleHBvcnQgZGVmYXVsdCAnQGNoYXJzZXQgXCJVVEYtOFwiO2Rpdntmb250LWZhbWlseTpcIkhlbHZldGljYVwiLFwiQXJpYWxcIixzYW5zLXNlcmlmO2ZvbnQtc2l6ZToxNHB4O2ZvbnQtd2VpZ2h0OjQwMDtsaW5lLWhlaWdodDoyMHB4fWgxLGgyLGgzLGg0LGg1LGg2LHB7cGFkZGluZzowfWgxIHNtYWxsLGgyIHNtYWxsLGgzIHNtYWxsLGg0IHNtYWxsLGg1IHNtYWxsLGg2IHNtYWxse2ZvbnQtZmFtaWx5OlwiUm9ib3RvXCIsXCJIZWx2ZXRpY2FcIixcIkFyaWFsXCIsc2Fucy1zZXJpZjtmb250LXdlaWdodDo0MDA7bGluZS1oZWlnaHQ6MS4zNTtsZXR0ZXItc3BhY2luZzotLjAyZW07b3BhY2l0eTouNTQ7Zm9udC1zaXplOi42ZW19aDF7Zm9udC1zaXplOjU2cHg7bGluZS1oZWlnaHQ6MS4zNTtsZXR0ZXItc3BhY2luZzotLjAyZW07bWFyZ2luOjI0cHggMH1oMSxoMntmb250LWZhbWlseTpcIlJvYm90b1wiLFwiSGVsdmV0aWNhXCIsXCJBcmlhbFwiLHNhbnMtc2VyaWY7Zm9udC13ZWlnaHQ6NDAwfWgye2ZvbnQtc2l6ZTo0NXB4O2xpbmUtaGVpZ2h0OjQ4cHh9aDIsaDN7bWFyZ2luOjI0cHggMH1oM3tmb250LXNpemU6MzRweDtsaW5lLWhlaWdodDo0MHB4fWgzLGg0e2ZvbnQtZmFtaWx5OlwiUm9ib3RvXCIsXCJIZWx2ZXRpY2FcIixcIkFyaWFsXCIsc2Fucy1zZXJpZjtmb250LXdlaWdodDo0MDB9aDR7Zm9udC1zaXplOjI0cHg7bGluZS1oZWlnaHQ6MzJweDstbW96LW9zeC1mb250LXNtb290aGluZzpncmF5c2NhbGU7bWFyZ2luOjI0cHggMCAxNnB4fWg1e2ZvbnQtc2l6ZToyMHB4O2ZvbnQtd2VpZ2h0OjUwMDtsaW5lLWhlaWdodDoxO2xldHRlci1zcGFjaW5nOi4wMmVtfWg1LGg2e2ZvbnQtZmFtaWx5OlwiUm9ib3RvXCIsXCJIZWx2ZXRpY2FcIixcIkFyaWFsXCIsc2Fucy1zZXJpZjttYXJnaW46MjRweCAwIDE2cHh9aDZ7Zm9udC1zaXplOjE2cHg7bGV0dGVyLXNwYWNpbmc6LjA0ZW19aDYscHtmb250LXdlaWdodDo0MDA7bGluZS1oZWlnaHQ6MjRweH1we2ZvbnQtc2l6ZToxNHB4O2xldHRlci1zcGFjaW5nOjA7bWFyZ2luOjAgMCAxNnB4fWF7Y29sb3I6I2ZmNDA4MTtmb250LXdlaWdodDo1MDB9YmxvY2txdW90ZXtmb250LWZhbWlseTpcIlJvYm90b1wiLFwiSGVsdmV0aWNhXCIsXCJBcmlhbFwiLHNhbnMtc2VyaWY7cG9zaXRpb246cmVsYXRpdmU7Zm9udC1zaXplOjI0cHg7Zm9udC13ZWlnaHQ6MzAwO2ZvbnQtc3R5bGU6aXRhbGljO2xpbmUtaGVpZ2h0OjEuMzU7bGV0dGVyLXNwYWNpbmc6LjA4ZW19YmxvY2txdW90ZTpiZWZvcmV7cG9zaXRpb246YWJzb2x1dGU7bGVmdDotLjVlbTtjb250ZW50OlxcJ+KAnFxcJ31ibG9ja3F1b3RlOmFmdGVye2NvbnRlbnQ6XFwn4oCdXFwnO21hcmdpbi1sZWZ0Oi0uMDVlbX1tYXJre2JhY2tncm91bmQtY29sb3I6I2Y0ZmY4MX1kdHtmb250LXdlaWdodDo3MDB9YWRkcmVzc3tmb250LXNpemU6MTJweDtsaW5lLWhlaWdodDoxO2ZvbnQtc3R5bGU6bm9ybWFsfWFkZHJlc3MsdWwsb2x7Zm9udC13ZWlnaHQ6NDAwO2xldHRlci1zcGFjaW5nOjB9dWwsb2x7Zm9udC1zaXplOjE0cHg7bGluZS1oZWlnaHQ6MjRweH0ubWRsLXR5cG9ncmFwaHktLWRpc3BsYXktNCwubWRsLXR5cG9ncmFwaHktLWRpc3BsYXktNC1jb2xvci1jb250cmFzdHtmb250LWZhbWlseTpcIlJvYm90b1wiLFwiSGVsdmV0aWNhXCIsXCJBcmlhbFwiLHNhbnMtc2VyaWY7Zm9udC1zaXplOjExMnB4O2ZvbnQtd2VpZ2h0OjMwMDtsaW5lLWhlaWdodDoxO2xldHRlci1zcGFjaW5nOi0uMDRlbX0ubWRsLXR5cG9ncmFwaHktLWRpc3BsYXktNC1jb2xvci1jb250cmFzdHtvcGFjaXR5Oi41NH0ubWRsLXR5cG9ncmFwaHktLWRpc3BsYXktMywubWRsLXR5cG9ncmFwaHktLWRpc3BsYXktMy1jb2xvci1jb250cmFzdHtmb250LWZhbWlseTpcIlJvYm90b1wiLFwiSGVsdmV0aWNhXCIsXCJBcmlhbFwiLHNhbnMtc2VyaWY7Zm9udC1zaXplOjU2cHg7Zm9udC13ZWlnaHQ6NDAwO2xpbmUtaGVpZ2h0OjEuMzU7bGV0dGVyLXNwYWNpbmc6LS4wMmVtfS5tZGwtdHlwb2dyYXBoeS0tZGlzcGxheS0zLWNvbG9yLWNvbnRyYXN0e29wYWNpdHk6LjU0fS5tZGwtdHlwb2dyYXBoeS0tZGlzcGxheS0yLC5tZGwtdHlwb2dyYXBoeS0tZGlzcGxheS0yLWNvbG9yLWNvbnRyYXN0e2ZvbnQtZmFtaWx5OlwiUm9ib3RvXCIsXCJIZWx2ZXRpY2FcIixcIkFyaWFsXCIsc2Fucy1zZXJpZjtmb250LXNpemU6NDVweDtmb250LXdlaWdodDo0MDA7bGluZS1oZWlnaHQ6NDhweH0ubWRsLXR5cG9ncmFwaHktLWRpc3BsYXktMi1jb2xvci1jb250cmFzdHtvcGFjaXR5Oi41NH0ubWRsLXR5cG9ncmFwaHktLWRpc3BsYXktMSwubWRsLXR5cG9ncmFwaHktLWRpc3BsYXktMS1jb2xvci1jb250cmFzdHtmb250LWZhbWlseTpcIlJvYm90b1wiLFwiSGVsdmV0aWNhXCIsXCJBcmlhbFwiLHNhbnMtc2VyaWY7Zm9udC1zaXplOjM0cHg7Zm9udC13ZWlnaHQ6NDAwO2xpbmUtaGVpZ2h0OjQwcHh9Lm1kbC10eXBvZ3JhcGh5LS1kaXNwbGF5LTEtY29sb3ItY29udHJhc3R7b3BhY2l0eTouNTR9Lm1kbC10eXBvZ3JhcGh5LS1oZWFkbGluZSwubWRsLXR5cG9ncmFwaHktLWhlYWRsaW5lLWNvbG9yLWNvbnRyYXN0e2ZvbnQtZmFtaWx5OlwiUm9ib3RvXCIsXCJIZWx2ZXRpY2FcIixcIkFyaWFsXCIsc2Fucy1zZXJpZjtmb250LXNpemU6MjRweDtmb250LXdlaWdodDo0MDA7bGluZS1oZWlnaHQ6MzJweDstbW96LW9zeC1mb250LXNtb290aGluZzpncmF5c2NhbGV9Lm1kbC10eXBvZ3JhcGh5LS1oZWFkbGluZS1jb2xvci1jb250cmFzdHtvcGFjaXR5Oi44N30ubWRsLXR5cG9ncmFwaHktLXRpdGxlLC5tZGwtdHlwb2dyYXBoeS0tdGl0bGUtY29sb3ItY29udHJhc3R7Zm9udC1mYW1pbHk6XCJSb2JvdG9cIixcIkhlbHZldGljYVwiLFwiQXJpYWxcIixzYW5zLXNlcmlmO2ZvbnQtc2l6ZToyMHB4O2ZvbnQtd2VpZ2h0OjUwMDtsaW5lLWhlaWdodDoxO2xldHRlci1zcGFjaW5nOi4wMmVtfS5tZGwtdHlwb2dyYXBoeS0tdGl0bGUtY29sb3ItY29udHJhc3R7b3BhY2l0eTouODd9Lm1kbC10eXBvZ3JhcGh5LS1zdWJoZWFkLC5tZGwtdHlwb2dyYXBoeS0tc3ViaGVhZC1jb2xvci1jb250cmFzdHtmb250LWZhbWlseTpcIlJvYm90b1wiLFwiSGVsdmV0aWNhXCIsXCJBcmlhbFwiLHNhbnMtc2VyaWY7Zm9udC1zaXplOjE2cHg7Zm9udC13ZWlnaHQ6NDAwO2xpbmUtaGVpZ2h0OjI0cHg7bGV0dGVyLXNwYWNpbmc6LjA0ZW19Lm1kbC10eXBvZ3JhcGh5LS1zdWJoZWFkLWNvbG9yLWNvbnRyYXN0e29wYWNpdHk6Ljg3fS5tZGwtdHlwb2dyYXBoeS0tYm9keS0yLC5tZGwtdHlwb2dyYXBoeS0tYm9keS0yLWNvbG9yLWNvbnRyYXN0e2ZvbnQtc2l6ZToxNHB4O2ZvbnQtd2VpZ2h0OjcwMDtsaW5lLWhlaWdodDoyNHB4O2xldHRlci1zcGFjaW5nOjB9Lm1kbC10eXBvZ3JhcGh5LS1ib2R5LTItY29sb3ItY29udHJhc3R7b3BhY2l0eTouODd9Lm1kbC10eXBvZ3JhcGh5LS1ib2R5LTEsLm1kbC10eXBvZ3JhcGh5LS1ib2R5LTEtY29sb3ItY29udHJhc3R7Zm9udC1zaXplOjE0cHg7Zm9udC13ZWlnaHQ6NDAwO2xpbmUtaGVpZ2h0OjI0cHg7bGV0dGVyLXNwYWNpbmc6MH0ubWRsLXR5cG9ncmFwaHktLWJvZHktMS1jb2xvci1jb250cmFzdHtvcGFjaXR5Oi44N30ubWRsLXR5cG9ncmFwaHktLWJvZHktMi1mb3JjZS1wcmVmZXJyZWQtZm9udCwubWRsLXR5cG9ncmFwaHktLWJvZHktMi1mb3JjZS1wcmVmZXJyZWQtZm9udC1jb2xvci1jb250cmFzdHtmb250LWZhbWlseTpcIlJvYm90b1wiLFwiSGVsdmV0aWNhXCIsXCJBcmlhbFwiLHNhbnMtc2VyaWY7Zm9udC1zaXplOjE0cHg7Zm9udC13ZWlnaHQ6NTAwO2xpbmUtaGVpZ2h0OjI0cHg7bGV0dGVyLXNwYWNpbmc6MH0ubWRsLXR5cG9ncmFwaHktLWJvZHktMi1mb3JjZS1wcmVmZXJyZWQtZm9udC1jb2xvci1jb250cmFzdHtvcGFjaXR5Oi44N30ubWRsLXR5cG9ncmFwaHktLWJvZHktMS1mb3JjZS1wcmVmZXJyZWQtZm9udCwubWRsLXR5cG9ncmFwaHktLWJvZHktMS1mb3JjZS1wcmVmZXJyZWQtZm9udC1jb2xvci1jb250cmFzdHtmb250LWZhbWlseTpcIlJvYm90b1wiLFwiSGVsdmV0aWNhXCIsXCJBcmlhbFwiLHNhbnMtc2VyaWY7Zm9udC1zaXplOjE0cHg7Zm9udC13ZWlnaHQ6NDAwO2xpbmUtaGVpZ2h0OjI0cHg7bGV0dGVyLXNwYWNpbmc6MH0ubWRsLXR5cG9ncmFwaHktLWJvZHktMS1mb3JjZS1wcmVmZXJyZWQtZm9udC1jb2xvci1jb250cmFzdHtvcGFjaXR5Oi44N30ubWRsLXR5cG9ncmFwaHktLWNhcHRpb24sLm1kbC10eXBvZ3JhcGh5LS1jYXB0aW9uLWZvcmNlLXByZWZlcnJlZC1mb250e2ZvbnQtc2l6ZToxMnB4O2ZvbnQtd2VpZ2h0OjQwMDtsaW5lLWhlaWdodDoxO2xldHRlci1zcGFjaW5nOjB9Lm1kbC10eXBvZ3JhcGh5LS1jYXB0aW9uLWZvcmNlLXByZWZlcnJlZC1mb250e2ZvbnQtZmFtaWx5OlwiUm9ib3RvXCIsXCJIZWx2ZXRpY2FcIixcIkFyaWFsXCIsc2Fucy1zZXJpZn0ubWRsLXR5cG9ncmFwaHktLWNhcHRpb24tY29sb3ItY29udHJhc3QsLm1kbC10eXBvZ3JhcGh5LS1jYXB0aW9uLWZvcmNlLXByZWZlcnJlZC1mb250LWNvbG9yLWNvbnRyYXN0e2ZvbnQtc2l6ZToxMnB4O2ZvbnQtd2VpZ2h0OjQwMDtsaW5lLWhlaWdodDoxO2xldHRlci1zcGFjaW5nOjA7b3BhY2l0eTouNTR9Lm1kbC10eXBvZ3JhcGh5LS1jYXB0aW9uLWZvcmNlLXByZWZlcnJlZC1mb250LWNvbG9yLWNvbnRyYXN0LC5tZGwtdHlwb2dyYXBoeS0tbWVudXtmb250LWZhbWlseTpcIlJvYm90b1wiLFwiSGVsdmV0aWNhXCIsXCJBcmlhbFwiLHNhbnMtc2VyaWZ9Lm1kbC10eXBvZ3JhcGh5LS1tZW51e2ZvbnQtc2l6ZToxNHB4O2ZvbnQtd2VpZ2h0OjUwMDtsaW5lLWhlaWdodDoxO2xldHRlci1zcGFjaW5nOjB9Lm1kbC10eXBvZ3JhcGh5LS1tZW51LWNvbG9yLWNvbnRyYXN0e29wYWNpdHk6Ljg3fS5tZGwtdHlwb2dyYXBoeS0tbWVudS1jb2xvci1jb250cmFzdCwubWRsLXR5cG9ncmFwaHktLWJ1dHRvbiwubWRsLXR5cG9ncmFwaHktLWJ1dHRvbi1jb2xvci1jb250cmFzdHtmb250LWZhbWlseTpcIlJvYm90b1wiLFwiSGVsdmV0aWNhXCIsXCJBcmlhbFwiLHNhbnMtc2VyaWY7Zm9udC1zaXplOjE0cHg7Zm9udC13ZWlnaHQ6NTAwO2xpbmUtaGVpZ2h0OjE7bGV0dGVyLXNwYWNpbmc6MH0ubWRsLXR5cG9ncmFwaHktLWJ1dHRvbiwubWRsLXR5cG9ncmFwaHktLWJ1dHRvbi1jb2xvci1jb250cmFzdHt0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2V9Lm1kbC10eXBvZ3JhcGh5LS1idXR0b24tY29sb3ItY29udHJhc3R7b3BhY2l0eTouODd9Lm1kbC10eXBvZ3JhcGh5LS10ZXh0LWxlZnR7dGV4dC1hbGlnbjpsZWZ0fS5tZGwtdHlwb2dyYXBoeS0tdGV4dC1yaWdodHt0ZXh0LWFsaWduOnJpZ2h0fS5tZGwtdHlwb2dyYXBoeS0tdGV4dC1jZW50ZXJ7dGV4dC1hbGlnbjpjZW50ZXJ9Lm1kbC10eXBvZ3JhcGh5LS10ZXh0LWp1c3RpZnl7dGV4dC1hbGlnbjpqdXN0aWZ5fS5tZGwtdHlwb2dyYXBoeS0tdGV4dC1ub3dyYXB7d2hpdGUtc3BhY2U6bm93cmFwfS5tZGwtdHlwb2dyYXBoeS0tdGV4dC1sb3dlcmNhc2V7dGV4dC10cmFuc2Zvcm06bG93ZXJjYXNlfS5tZGwtdHlwb2dyYXBoeS0tdGV4dC11cHBlcmNhc2V7dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlfS5tZGwtdHlwb2dyYXBoeS0tdGV4dC1jYXBpdGFsaXple3RleHQtdHJhbnNmb3JtOmNhcGl0YWxpemV9Lm1kbC10eXBvZ3JhcGh5LS1mb250LXRoaW57Zm9udC13ZWlnaHQ6MjAwIWltcG9ydGFudH0ubWRsLXR5cG9ncmFwaHktLWZvbnQtbGlnaHR7Zm9udC13ZWlnaHQ6MzAwIWltcG9ydGFudH0ubWRsLXR5cG9ncmFwaHktLWZvbnQtcmVndWxhcntmb250LXdlaWdodDo0MDAhaW1wb3J0YW50fS5tZGwtdHlwb2dyYXBoeS0tZm9udC1tZWRpdW17Zm9udC13ZWlnaHQ6NTAwIWltcG9ydGFudH0ubWRsLXR5cG9ncmFwaHktLWZvbnQtYm9sZHtmb250LXdlaWdodDo3MDAhaW1wb3J0YW50fS5tZGwtdHlwb2dyYXBoeS0tZm9udC1ibGFja3tmb250LXdlaWdodDo5MDAhaW1wb3J0YW50fSc7XG4iLCJpbXBvcnQgcmVnaXN0ZXJCdXR0b24gZnJvbSAnLi9tYXRlcmlhbC1idXR0b24nO1xuaW1wb3J0IHJlZ2lzdGVySW5wdXQgIGZyb20gJy4vbWF0ZXJpYWwtaW5wdXQnO1xuXG5yZWdpc3RlckJ1dHRvbigpO1xucmVnaXN0ZXJJbnB1dCgpO1xuIiwiaW1wb3J0IHtkZWZpbmVDb21wb25lbnR9IGZyb20gJy4vcmVnaXN0ZXInO1xuaW1wb3J0IENTU19CVVRUT04gZnJvbSAnLi9jc3Nqcy9idXR0b24uY3NzJztcbmltcG9ydCBDU1NfUklQUExFIGZyb20gJy4vY3NzanMvcmlwcGxlLmNzcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCkge1xuICBkZWZpbmVDb21wb25lbnQoJ21hdGVyaWFsLWJ1dHRvbicsIHtcbiAgICBtZGxFbDogJ2J1dHRvbicsXG4gICAgY3JlYXRlU2hhZG93RE9NOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBjbGFzc05hbWUgPSBcIm1kbC1idXR0b24gbWRsLWpzLWJ1dHRvbiBtZGwtYnV0dG9uLS1hY2NlbnRcIjtcbiAgICAgIGlmICh0aGlzLmhhc0F0dHJpYnV0ZSgncmFpc2VkJykpIHtcbiAgICAgICAgY2xhc3NOYW1lICs9IFwiIG1kbC1idXR0b24tLXJhaXNlZFwiO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLmhhc0F0dHJpYnV0ZSgnbm9pbmsnKSkge1xuICAgICAgICBjbGFzc05hbWUgKz0gXCIgbWRsLWpzLXJpcHBsZS1lZmZlY3RcIjtcbiAgICAgIH1cbiAgICAgIHRoaXMuY3JlYXRlU2hhZG93Um9vdCgpLmlubmVySFRNTCA9XG4gICAgICAgICc8c3R5bGU+JyArIENTU19CVVRUT04gKyBDU1NfUklQUExFICsgJzwvc3R5bGU+JyArXG4gICAgICAgICc8YnV0dG9uIGNsYXNzPVwiJyArIGNsYXNzTmFtZSArICdcIj48Y29udGVudD48L2NvbnRlbnQ+PC9idXR0b24+JztcbiAgICB9XG4gIH0pO1xufTtcbiIsImltcG9ydCB7ZGVmaW5lQ29tcG9uZW50fSBmcm9tICcuL3JlZ2lzdGVyJztcbmltcG9ydCBDU1NfVEVYVEZJRUxEIGZyb20gJy4vY3NzanMvdGV4dGZpZWxkLmNzcyc7XG5pbXBvcnQgQ1NTX1RZUE9HUkFQSFkgZnJvbSAnLi9jc3Nqcy90eXBvZ3JhcGh5LmNzcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCkge1xuICBkZWZpbmVDb21wb25lbnQoJ21hdGVyaWFsLWlucHV0Jywge1xuICAgIG1kbEVsOiAnLm1kbC10ZXh0ZmllbGQnLFxuICAgIGNyZWF0ZVNoYWRvd0RPTTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbGFiZWwgPSB0aGlzLmdldEF0dHJpYnV0ZSgnbGFiZWwnKSB8fCAnVGV4dC4uLicsXG4gICAgICAgICAgbGFiZWxGbG9hdCA9IHRoaXMuaGFzQXR0cmlidXRlKCdmbG9hdGluZy1sYWJlbCcpID8gJyBtZGwtdGV4dGZpZWxkLS1mbG9hdGluZy1sYWJlbCcgOiAnJyxcbiAgICAgICAgICBwYXR0ZXJuID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ3BhdHRlcm4nKSxcbiAgICAgICAgICBlcnJvciA9IHRoaXMuZ2V0QXR0cmlidXRlKCdlcnJvcicpLFxuICAgICAgICAgIHBhdHRlcm5IVE1MID0gcGF0dGVybiA/ICcgcGF0dGVybj1cIicgKyBwYXR0ZXJuICsgJ1wiJyA6ICcnLFxuICAgICAgICAgIGVycm9ySFRNTCA9IGVycm9yID8gJzxzcGFuIGNsYXNzPVwibWRsLXRleHRmaWVsZF9fZXJyb3JcIj4nICsgZXJyb3IgKyAnPC9zcGFuPicgOiAnJztcblxuICAgICAgdGhpcy5jcmVhdGVTaGFkb3dSb290KCkuaW5uZXJIVE1MID1cbiAgICAgICAgJzxzdHlsZT4nICsgQ1NTX1RFWFRGSUVMRCArIENTU19UWVBPR1JBUEhZICsgJzwvc3R5bGU+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwibWRsLXRleHRmaWVsZCBtZGwtanMtdGV4dGZpZWxkJyArIGxhYmVsRmxvYXQgKyAnXCI+JyArXG4gICAgICAgICAgJzxpbnB1dCBjbGFzcz1cIm1kbC10ZXh0ZmllbGRfX2lucHV0XCIgdHlwZT1cInRleHRcIiBpZD1cIm1kbC1pbnB1dDFcIicrIHBhdHRlcm5IVE1MICsgJy8+JyArXG4gICAgICAgICAgJzxsYWJlbCBjbGFzcz1cIm1kbC10ZXh0ZmllbGRfX2xhYmVsXCIgZm9yPVwibWRsLWlucHV0MVwiPicgKyBsYWJlbCArICc8L2xhYmVsPicgK1xuICAgICAgICAgIGVycm9ySFRNTCArXG4gICAgICAgICc8L2Rpdj4nO1xuICAgIH0sXG4gICAgcHJvdG86IHtcbiAgICAgIHZhbHVlOiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuc2hhZG93Um9vdC5xdWVyeVNlbGVjdG9yKCcubWRsLXRleHRmaWVsZF9faW5wdXQnKS52YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSk7XG59O1xuIiwiZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUNvbXBvbmVudChjb21wb25lbnROYW1lLCBjb21wb25lbnREZWYpIHtcbiAgdmFyIGNvbXBvbmVudFByb3RvID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUsIHtcbiAgICBjcmVhdGVkQ2FsbGJhY2s6IHtcbiAgICAgIHZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29tcG9uZW50RGVmLmNyZWF0ZVNoYWRvd0RPTS5jYWxsKHRoaXMpO1xuICAgICAgICB3aW5kb3cuY29tcG9uZW50SGFuZGxlci51cGdyYWRlRWxlbWVudCh0aGlzLnNoYWRvd1Jvb3QucXVlcnlTZWxlY3Rvcihjb21wb25lbnREZWYubWRsRWwpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICB2YXIgZXh0cmFQcm9wcyA9IGNvbXBvbmVudERlZi5wcm90bztcbiAgaWYgKGV4dHJhUHJvcHMpIHtcbiAgICBmb3IgKHZhciBwcm9wTmFtZSBpbiBleHRyYVByb3BzKSB7XG4gICAgICBpZiAoZXh0cmFQcm9wcy5oYXNPd25Qcm9wZXJ0eShwcm9wTmFtZSkpIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNvbXBvbmVudFByb3RvLCBwcm9wTmFtZSwgZXh0cmFQcm9wc1twcm9wTmFtZV0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoY29tcG9uZW50TmFtZSwge3Byb3RvdHlwZTogY29tcG9uZW50UHJvdG99KTtcbn07XG4iXX0=
