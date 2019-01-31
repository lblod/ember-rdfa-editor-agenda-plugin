import Component from '@ember/component';
import layout from '../../../templates/components/agenda/agendapunt/edit-punt';
import { computed } from '@ember/object';
export default Component.extend({
  layout,

  //some casting is needed, should be fixed in generic-model-plugin-utils
  geplandOpenbaar: computed('agendapunt.geplandOpenbaar', function(){
    return this.agendapunt.geplandOpenbaar == 'true' || this.agendapunt.geplandOpenbaar == true;
  }),

  actions: {
    toggleGeplandOpenbaar(){
      this.agendapunt.set('geplandOpenbaar', !this.agendapunt.geplandOpenbaar);
    },

    remove(){
      this.onRemove(this.agendapunt);
    }
  }
});
