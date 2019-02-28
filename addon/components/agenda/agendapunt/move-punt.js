import Component from '@ember/component';
import layout from '../../../templates/components/agenda/agendapunt/move-punt';
import { task } from 'ember-concurrency';

export default Component.extend({
  layout,

  init() {
    this._super(...arguments);
    this.locationInAgenda = this.locationInAgenda || [{ index: 0, name: 'vooraan in agenda' },
                                                      { index: -1, name: 'achteraan in agenda' },
                                                      { index: 1, name: 'na agendapunt' } ];
  },

  hanldeMoveLocationAgendapunt(selected){
    if(selected.index == 1){
      this.set('agendapuntenTitelSelector', true);
      return;
    }

    if(this.agendapunten.length == 0){
      this.onUpdateLocation(0);
      return;
    }

    if(selected.index == -1){
      this.onUpdateLocation(this.agendapunten.length -1);
      return;
    }

    this.onUpdateLocation(selected.index);

    this.set('agendapuntenTitelSelector', false);
  },

  didReceiveAttrs(){
    this._super(...arguments);
    if(this.agendapunten){
      this._agendapunten = this.agendapunten.filter(a => a.uri != this.agendapunt.uri); //exclude current agendapunt
    }
  },

  searchTitle: task(function*(searchData) {
    return this._agendapunten.filter(a => a.titel.toLowerCase().indexOf(searchData.toLowerCase().trim()) > -1);
  }),

  actions: {

    selectLocation(selected){
      this.hanldeMoveLocationAgendapunt(selected);
      this.set('_selectedLocation', selected);
    },

    selectAfter(selected){
      this.set('_selectedAfterAgendapunt', selected);
      let currIndex = this.agendapunten.indexOf(selected);
      this.onUpdateLocation(currIndex);
    }

  }

});
