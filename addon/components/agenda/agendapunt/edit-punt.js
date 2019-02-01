import Component from '@ember/component';
import layout from '../../../templates/components/agenda/agendapunt/edit-punt';

export default Component.extend({
  layout,
  actions: {
    toggleGeplandOpenbaar(){
      this.agendapunt.set('geplandOpenbaar', !this.agendapunt.geplandOpenbaar);
    },

    remove(){
      this.onRemove(this.agendapunt);
    },

    onUpdateLocation(newIndex){
      this.onUpdateLocation(newIndex);
    }
  }
});
