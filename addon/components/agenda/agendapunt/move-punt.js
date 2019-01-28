import Component from '@ember/component';
import layout from '../../../templates/components/agenda/agendapunt/move-punt';
import { A } from '@ember/array';
import { task } from 'ember-concurrency';

//TODO: MOOOOVE LOGIC
export default Component.extend({
  layout,
  locationInAgenda: [{ id: 0, name: 'vooraan in agenda' },
                     { id: -1, name: 'achteraan in agenda' },
                     { id: 1, name: 'na agendapunt' } ],

  hanldeMoveLocationAgendapunt(selected){
    if(selected.id == 1){
      this.set('agendapuntenTitelSelector', true);
      return;
    }
    this.set('agendapuntenTitelSelector', false);
    return;
  },

  didReceiveAttrs(){
    this._super(...arguments);
    if(this.agendapunten){
      this._agendapunten = A(this.agendapunten.map( (a, idx) => { return { id: idx, agendapunt: a }; }));
    }
  },

  searchTitle: task(function*(searchData) {
    return this._agendapunten.filter(a => a.agendapunt.titel.trim().toLowerCase().indexOf(searchData.toLowerCase().trim()) > -1);
  }),

  actions: {

    selectLocation(selected){
      this.hanldeMoveLocationAgendapunt(selected);
      this.set('selectedLocation', selected);
    },

    selectAfter(selected){

    }

  }

});
