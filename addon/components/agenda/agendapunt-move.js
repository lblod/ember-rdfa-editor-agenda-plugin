import Component from '@ember/component';
import layout from '../../templates/components/agenda/agendapunt-move';
import { equal, filter } from '@ember/object/computed';
import { A } from '@ember/array';

export default Component.extend({
  layout,

  agendapunt: null,
  agendapunten: null,
  selectedLocation: null,
  selectedAfterAgendapunt: null,

  afterAgendapuntOptions: filter('agendapunten', function(agendapunt) {
    return agendapunt.uri != this.agendapunt.uri;
  }),
  showAfterAgendapuntOptions: equal('selectedLocation.code', 'after'),

  init() {
    this._super(...arguments);
    this.set('agendapunten', this.agendapunten || A());
    this.locationOptions = [
      { code: 'start', name: 'Vooraan in agenda' },
      { code: 'after', name: 'Na agendapunt' },
      { code: 'end', name: 'Achteraan in agenda' }
    ];
  },

  calculateNewPosition() {
    if (this.selectedLocation) {
      if (this.selectedLocation.code == 'start') {
        this.agendapunt.position = 0;
      } else if (this.selectedLocation.code == 'end') {
        this.agendapunt.position = this.agendapunten.length - 1;
      } else if (this.selectedLocation.code == 'after' && this.selectedAfterAgendapunt) {
        /**
           New position of agendapunt depends whether selectedAfterAgendapunt is currently before/after agendapunt.
           E.g. Agendapunten: [a, b, c, d, e]. Index starts at 0. AP is first removed and then inserted at the new position.
           To put 'b' after 'd': current position of 'b' is 1, current position of 'd' is 3, new position of 'b' must be 3.
           To put 'd' after 'b': current position of 'd' is 3, current position of 'b' is 1, new position of 'd' must be 2.
        **/
        const afterAgendapuntPos = this.agendapunten.indexOf(this.selectedAfterAgendapunt);

        if (afterAgendapuntPos == this.agendapunten.length - 1)  // agendapunt needs to move to the end
          this.agendapunt.position = this.agendapunten.length - 1;
        else
          this.agendapunt.position = this.originalPosition < afterAgendapuntPos ? afterAgendapuntPos : afterAgendapuntPos + 1;
      }
    }
  },

  actions: {
    selectLocation(location) {
      this.set('selectedLocation', location);
      this.set('selectedAfterAgendapunt', null);
      this.calculateNewPosition();
    },
    selectAfterAgendapunt(afterAgendapunt) {
      this.set('selectedAfterAgendapunt', afterAgendapunt);
      this.calculateNewPosition();
    }
  }
});
