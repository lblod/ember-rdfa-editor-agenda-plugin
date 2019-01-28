import Component from '@ember/component';
import layout from '../../templates/components/agenda/agenda-container';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import { copy } from '@ember/object/internals';

//TODO: work on copys of object
export default Component.extend({
  layout,
  metaModelQuery: service(),
  tripleSerialization: service('triplesSerializationUtils'),

  createNewAgendapunt: task(function* (){
    let typeUri = (yield this.metaModelQuery.getMetaModelForLabel('agendapunt')).get('rdfaType');
    let agendapunt = yield this.tripleSerialization.createEmptyResource(typeUri, true);
    this.set('agendapuntToEdit', agendapunt);
    this.set('createMode', true);
    this.set('editMode', true);
  }),

  actions: {

    create(){
      this.createNewAgendapunt.perform();
    },

    edit(agendapunt){
      this.set('editMode', true);
      this.set('agendapuntToEdit', agendapunt);
    },

    insert(){
      this.onInsert();
    },

    cancel(){
      this.onCancel();
    },

    saveEdit(){
      this.agendapunten.pushObject(this.agendapuntToEdit);
      this.set('createMode', false);
      this.set('editMode', false);
    },

    cancelEdit(){
      this.set('agendapuntToEdit', null);
      this.set('createMode', false);
      this.set('editMode', false);
    }
  }
});
