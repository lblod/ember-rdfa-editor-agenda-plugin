import Component from '@ember/component';
import layout from '../../templates/components/agenda/agenda-modal';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import { assign } from '@ember/polyfills';
import EmberObject from '@ember/object';
import { notEmpty } from '@ember/object/computed';
import { A } from '@ember/array';
import { next } from '@ember/runloop';

export default Component.extend({
  layout,

  metaModelQuery: service(),
  tripleSerialization: service('triplesSerializationUtils'),

  cancel: null,
  insert: null,
  agendapunten: null,
  editMode: notEmpty('selectedAgendapunt'),
  selectedAgendapunt: null,
  selectedAgendapuntOriginal: null,

  createAgendapunt: task(function* () {
    try {
      const agendapuntMetaModel = yield this.metaModelQuery.getMetaModelForLabel('agendapunt');
      const typeUri = agendapuntMetaModel.get('rdfaType');
      const agendapunt = yield this.tripleSerialization.createEmptyResource(typeUri, true);
      agendapunt.set('isCreationMode', true);
      agendapunt.set('geplandOpenbaar', false);
      agendapunt.set('bvapOpenbaar', false);
      agendapunt.set('position', this.agendapunten.length); // add new agendapunt at the end by default
      this.set('selectedAgendapunt', agendapunt);
      const copiedAgendapunt = EmberObject.create(assign({}, agendapunt));
      this.set('selectedAgendapuntOriginal', copiedAgendapunt);
      this.agendapunten.pushObject(agendapunt);
    } catch (e) {
      console.log(e);
    }
  }),

  disableEditMode() {
    this.set('selectedAgendapunt', null);
    this.set('selectedAgendapuntOriginal', null);
  },

  actions: {
    editAgendapunt(agendapunt) {
      const position = this.agendapunten.indexOf(agendapunt);
      agendapunt.set('position', position);
      this.set('selectedAgendapunt', agendapunt);
      const copiedAgendapunt = EmberObject.create(assign({}, agendapunt));
      this.set('selectedAgendapuntOriginal', copiedAgendapunt);
    },
    removeAgendapunt() {
      const originalPosition = this.selectedAgendapuntOriginal.position;
      this.agendapunten.removeAt(originalPosition);
      this.disableEditMode();
    },
    saveAgendapunt() {
      const originalPosition = this.selectedAgendapuntOriginal.position;
      let newPosition = this.selectedAgendapunt.position;

      this.selectedAgendapunt.set('isCreationMode', false);
      const copiedAgendapunt = EmberObject.create(assign({}, this.selectedAgendapunt));

      if (originalPosition == newPosition) {
        this.agendapunten.replace(originalPosition, 1, [copiedAgendapunt]);
      } else {
        this.agendapunten.removeAt(originalPosition);
        this.agendapunten.insertAt(newPosition, copiedAgendapunt);
      }

      this.disableEditMode();
    },
    cancelEditAgendapunt() {
      if (this.selectedAgendapunt.isCreationMode) {
        this.agendapunten.popObject();
      } else {
        const originalPosition = this.selectedAgendapuntOriginal.position;
        this.agendapunten.replace(originalPosition, 1, [this.selectedAgendapuntOriginal]);
      }

      this.disableEditMode();
    },
    insertAgenda() {
      if (this.agendapunten.length) {
        for (let i = 0; i < this.agendapunten.length; i++) {
          const agendapunt = this.agendapunten[i];
          // TODO: vorigeAgendapunt should be a single object, but triplesSerializationUtils only support Array at the moment.
          // Hence we wrap 'vorigeAgendapunt' in an array for now.
          if (i == 0) {
            agendapunt.set('vorigeAgendapunt', A());
          } else {
            const agendapunt = this.agendapunten[i];
            agendapunt.set('vorigeAgendapunt', A([this.agendapunten[i-1]]));
          }
        }
      }

      next(this, () => {  // make sure agenda/output/agenda-rdfa component has rerendered with updated 'vorigeAgendapunt'
        this.insert();
      });
    }
  }
});
