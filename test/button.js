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

  context('updated dynamically', function() {
    var fixtureGarden;
    var button, innerButton;

    beforeEach(function(done) {
      fixtureGarden = document.getElementById('fixture-garden');
      fixtureGarden.innerHTML = '';
      button = document.createElement('mdl-button');
      fixtureGarden.appendChild(button);
      window.requestAnimationFrame(function() {
        innerButton = button.shadowRoot.querySelector('.mdl-button');
        done();
      });
    });

    it('can change the disabled attribute', function(done) {
      expect(innerButton.disabled).not.to.be.ok;
      button.setAttribute('disabled', true);
      window.requestAnimationFrame(function() {
        expect(innerButton.disabled).to.be.true;
        done();
      });
    });

    it('can add/change icons', function(done) {
      expect(button.shadowRoot.querySelector('.material-icons')).to.be.null;
      button.setAttribute('icon', 'build');
      window.requestAnimationFrame(function() {
        var icon = button.shadowRoot.querySelector('.material-icons');
        expect(icon.textContent).to.equal('build');
        done();
      });
    });
  });
});
