describe('mdl-button', function() {
  var getMDLEl = function(id) {
    return document.getElementById(id).shadowRoot.querySelector('.mdl-button');
  };

  it('renders in Shadow DOM', function() {
    expect(getMDLEl('hello').className).to.contain('mdl-js-button');
  });

  it('upgrades its elements', function() {
    expect(getMDLEl('hello').dataset.upgraded).to.contain('MaterialButton');
  });

  it('proxies the disabled attribute', function() {
    expect(getMDLEl('dead-button').disabled).to.be.true;
  });
});
