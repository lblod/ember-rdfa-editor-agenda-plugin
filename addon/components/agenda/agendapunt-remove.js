import Component from '@ember/component';
import layout from '../../templates/components/agenda/agendapunt-remove';
import { next } from '@ember/runloop';

export default Component.extend({
  layout,
  tagName: '',

  agendapunt: null,
  isShowWaring: false,
  hasAgreed: false,
  remove: null,

  actions: {
    unconfirmRemoval() {
      this.set('hasAgreed', false);
      this.set('isShowingWarning', false);
    },
    showWarning(){
      this.set('isShowingWarning', true);
      next(this, () => {
        const element = document.getElementById('isShowingWarning-verwijder-agendapunt');
        element.scrollIntoView({behavior: "smooth", block: "end"});
      });
    }
  }
});
