import Component from '@ember/component';
import layout from '../../templates/components/agenda/agenda-container';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import { getProperties } from '@ember/object';

//TODO: work on copys of object
export default Component.extend({
  layout,
  metaModelQuery: service(),
  tripleSerialization: service('triplesSerializationUtils'),

  resetState(){
    this.set('agendapuntToEditOrig', null);
    this.set('agendapuntToEdit', null);
    this.set('createMode', false);
    this.set('editMode', false);
  },

  copy(instance){
    //clones, does not clone recursivly
    let keys = Object.keys(instance);
    return  keys.reduce((target, k) => {
      target[k] = instance.get(k);
      return target;
    }, {});
  },

  update(data, target){
    let keys = Object.keys(data);
    keys.forEach(key => target.set(key, data[key]));
  },

  createNewAgendapunt: task(function* (){
    let typeUri = (yield this.metaModelQuery.getMetaModelForLabel('agendapunt')).get('rdfaType');
    let agendapunt = yield this.tripleSerialization.createEmptyResource(typeUri, true);
    this.set('agendapuntToEdit', this.copy(agendapunt));
    this.set('agendapuntToEditOrig', agendapunt);
    this.set('createMode', true);
    this.set('editMode', true);
  }),

  actions: {

    create(){
      this.createNewAgendapunt.perform();
    },

    edit(agendapunt){
      this.set('editMode', true);
      this.set('agendapuntToEditOrig', agendapunt);
      this.set('agendapuntToEdit', this.copy(agendapunt, true));
    },

    insert(){
      this.onInsert();
    },

    cancel(){
      this.onCancel();
    },

    saveEdit(){
      this.update(this.agendapuntToEdit, this.agendapuntToEditOrig);
      if(this.createMode){
        this.agendapunten.pushObject(this.agendapuntToEditOrig);
      }
      this.resetState();
    },

    cancelEdit(){
      this.resetState();
    }
  }
});
