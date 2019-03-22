import Component from '@ember/component';
import layout from '../../../templates/components/agenda/agendapunt/edit-punt';
import { next } from '@ember/runloop';

export default Component.extend({
  layout,
  isShowingWarning: false,
  hasAgreed: false,

  actions: {
    toggleGeplandOpenbaar(){
      this.agendapunt.set('geplandOpenbaar', !this.agendapunt.geplandOpenbaar);
    },

    toggleBvapOpenbaar(){
      this.agendapunt.set('bvapOpenbaar', !this.agendapunt.bvapOpenbaar);
    },

    remove(){
      this.onRemove(this.agendapunt);
    },

    onUpdateLocation(newIndex){
      this.onUpdateLocation(newIndex);
    },

    showWarning(){
    	this.set("isShowingWarning", true);
    	next(this, () => {
	    	var element = document.getElementById("isShowingWarning-verwijder-agendapunt");
	    	element.scrollIntoView({behavior: "smooth", block: "end"})
    	});
    }
  }
});
