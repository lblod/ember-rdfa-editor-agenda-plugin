import Component from '@ember/component';
import layout from '../../templates/components/agenda/agendapunt-edit';
import { gt } from '@ember/object/computed';

export default Component.extend({
  layout,

  agendapunt: null,
  agendapunten: null,
  remove: null,

  hasMultipleAgendapunten: gt('agendapunten.length', 1),

  actions: {
    toggleGeplandOpenbaar(){
      this.agendapunt.set('geplandOpenbaar', !this.agendapunt.geplandOpenbaar);
    },

    toggleBvapOpenbaar(){
      this.agendapunt.set('bvapOpenbaar', !this.agendapunt.bvapOpenbaar);
    }
  }
});
