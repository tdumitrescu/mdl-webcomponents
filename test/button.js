describe('mdl-button', function() {
  var helloDOM = document.getElementById('hello').shadowRoot;
  var buttonEl = helloDOM.querySelector('.mdl-button');

  it('renders in Shadow DOM', function() {
    expect(buttonEl.className).to.contain('mdl-js-button');
  });

  it('upgrades its elements', function() {
    expect(buttonEl.dataset.upgraded).to.contain('MaterialButton');
  });
});
