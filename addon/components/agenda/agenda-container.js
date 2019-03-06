import Component from '@ember/component';
import layout from '../../templates/components/agenda/agenda-container';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import EmberObject from '@ember/object';
import { A } from '@ember/array';

export default Component.extend({
  layout,
  metaModelQuery: service(),
  tripleSerialization: service('triplesSerializationUtils'),

  resetState(){
    this.set('agendapuntToEditOrig', null);
    this.set('agendapuntToEdit', null);
    this.set('createMode', false);
    this.set('editMode', false);
    this.set('newIndex', null);
  },

  copy(instance){
    //clones, does not clone recursivly
    let keys = Object.keys(instance);
    return  keys.reduce((target, k) => {
      target.set(k, instance.get(k));
      return target;
    }, EmberObject.create({}));
  },

  update(data, target){
    let keys = Object.keys(data);
    keys.forEach(key => target.set(key, data[key]));
  },

  createNewAgendapunt: task(function* (){
    let typeUri = (yield this.metaModelQuery.getMetaModelForLabel('agendapunt')).get('rdfaType');
    let agendapunt = yield this.tripleSerialization.createEmptyResource(typeUri, true);
    agendapunt.set('geplandOpenbaar', false);
    this.set('agendapuntToEdit', this.copy(agendapunt));
    this.set('agendapuntToEditOrig', agendapunt);
    this.set('createMode', true);
    this.set('editMode', true);
  }),

  swapIndex(agendapunt, newIndex){
    if(!newIndex && newIndex != 0) return; //seriously?
    let old = this.agendapunten.indexOf(agendapunt);
    if(old == newIndex) return;
    this.agendapunten.splice(newIndex, 0, this.agendapunten.splice(old, 1)[0]);
  },

  setOrder(){
    //note a quirk from generic model plugin, it has no notion of has-one/has-many so this is why we have has many
    this.agendapunten[0].set('vorigeAgendapunt', A());
    this.agendapunten.slice(1).forEach((a,i) => a.set('vorigeAgendapunt', A([this.agendapunten[i]])));
    this.agendapunten.setObjects(this.agendapunten.map(a => a)); //it seems swapping elements in position does not trigger CP....
  },

  actions: {

    create(){
      this.createNewAgendapunt.perform();
    },

    remove(){
      this.agendapunten.removeObject(this.agendapuntToEditOrig);
      (this.agendapunten.length > 0) && this.setOrder();
      this.resetState();
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
      this.swapIndex(this.agendapuntToEditOrig, this.newIndex);
      this.setOrder();
      this.resetState();
    },

    cancelEdit(){
      this.resetState();
    },

    onUpdateLocation(newIndex){
      this.set('newIndex', newIndex);
    }
  }
});
