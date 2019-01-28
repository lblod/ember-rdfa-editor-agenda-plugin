import { reads } from '@ember/object/computed';
import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/agenda-card';
import { task } from 'ember-concurrency';
import { A } from '@ember/array';
import uuid from 'uuid/v4';
import { computed } from '@ember/object';

/**
 * Card displaying a hint of the Date plugin
 *  ASSUMPTIONS (to be checked)
 *  --------------------------
 *  - only one agenda to zitting
 *  - always a zitting
 *  - behandelingen van agendapunt linked to zitting! (through ext)
 *
 * @module editor-agenda-plugin
 * @class AgendaCard
 * @extends Ember.Component
 */
export default Component.extend({
  layout,

  /**
   * Region on which the card applies
   * @property location
   * @type [number,number]
   * @private
  */
  location: reads('info.location'),

  /**
   * Unique identifier of the event in the hints registry
   * @property hrId
   * @type Object
   * @private
  */
  hrId: reads('info.hrId'),

  /**
   * The RDFa editor instance
   * @property editor
   * @type RdfaEditor
   * @private
  */
  editor: reads('info.editor'),

  /**
   * Hints registry storing the cards
   * @property hintsRegistry
   * @type HintsRegistry
   * @private
  */
  hintsRegistry: reads('info.hintsRegistry'),

  outputAgendapuntenId: computed('id', function() {
    return `output-agendapunten-${this.elementId}`;
  }),

  didReceiveAttrs(){
    this._super(...arguments);
    this.loadData.perform();
  },


  loadData: task(function *(){
     if(this.info.editMode){
       // try{
       //   yield this.loadDataEditMode();
       //   if(this.mandatarissen.length == 0){
       //     //user might have broken the table. Reload it here
       //     yield this.loadDataInitialMode();
       //   }
       // }
       // catch(error){
       //   console.log('------ issues loading mandatarissen bijzonder comite');
       //   //issues might occur because of big refactoring of code.
       //   //So silent fallback reload this.
       //   yield this.loadDataInitialMode();
       // }
     }
    else
      this.set('agendapunten', A([]));
        //yield this.loadDataInitialMode();
  }),

  createWrappingHTML(innerHTML, type = 'ext:agendapuntenTable'){
    //adds uuid to trigger diff. Do it both on top and down the table to make sure everything gets triggered properly
    return `<div property="${type}">
             <span class="u-hidden">${uuid()}</span>
             ${innerHTML}
             <span class="u-hidden">${uuid()}</span>
            </div>`;
  },

  getDomNodeToUpdate(ref){
    return document.querySelector(`[property='${ref}']`);
  },

  findbvapDomNodes(){
    let bvap  = document.querySelectorAll("[typeof='besluit:BehandelingVanAgendapunt']");
    if(bvap.length == 0 )
      bvap = document.querySelectorAll("[typeof='http://data.vlaanderen.be/ns/besluit#BehandelingVanAgendapunt']");
    return bvap;
  },

  findPreviousBvapDomNode(bvapDom){
    let bvap  = document.querySelector("[property='besluit:gebeurtNa']");
    if(!bvap)
      bvap = document.querySelector("[typeof='http://data.vlaanderen.be/ns/besluit#gebeurtNa']");
    return bvap;
  },

  findBvapContainer(){
    let container = document.querySelector("[property='ext:behandelingVanAgendapuntenContainer']");
    if(!container)
      container = document.querySelector("[typeof='http://mu.semte.ch/vocabularies/ext/behandelingVanAgendapuntenContainer']");
    return container;
  },

  createBvapDom(agendapunt){
    let html = `
       <div property="ext:behandelt" resource="http://data.lblod.info/id/behandelingen-van-agendapunten/${uuid()}" typeof="besluit:BehandelingVanAgendapunt">
         <span property="besluit:openbaar" datatype="xsd:boolean" content="true" class="annotation--agendapunt--open__icon">
           <i class="fa ${agendapunt.geplandOpenbaar?'fa-eye':'fa-eye-slash'}"></i></span>
           <span property="dc:subject" resource="${agendapunt.uri}">
           <span>Agendapunt</span>
         </span>
         <br>
         <h3 class="h6">Aanwezigen bij agendapunt</h3>
         <p property="ext:insertAanwezigenText"><mark data-editor-highlight="true">Beheer aanwezigen bij agendapunt.</mark></p>
         <br>&nbsp;
       </div>`;
    return this.createElementsFromHTML(html)[0];
  },

  createElementsFromHTML(htmlString){
    let div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return Array.from(div.childNodes);
  },

  updatePreviousBvap(bvap, previous){
    let node = this.findPreviousBvapDomNode(bvap);

    if(!previous && node){
      node.remove();
      return;
    }

    if(!previous)
      return;

    bvap.setAttribute('resource', previous.getAttribute('resource'));
  },

  insertBvaps(){
    let bvaps = [ ...this.findbvapDomNodes() ];
    let bvapsMap = {};
    bvaps.forEach(ap => bvapsMap[ap.querySelector("[property='dc:subject']").getAttribute('resource')].push(ap));

    //clean up
    bvaps.forEach(ap => ap.remove());

    //first set order of bvaps
    let newBvaps = [];
    this.agendapunten.forEach(ap => {
      if(bvapsMap[ap.uri]){
        newBvaps.push(bvapsMap[ap.uri]);
      }
      else{
        newBvaps.push(this.createBvapDom(ap));
      }
    });

    //then update interlinking of bvaps
    newBvaps.forEach(( bvap, idx ) => this.updatePreviousBvap(bvap, newBvaps[idx - 1]));

    //big html from bvap
    return newBvaps.map(b => b.outerHTML).join('&nbsp;');
  },

  actions: {
    insert(){
      const html = this.createWrappingHTML(document.getElementById(this.outputAgendapuntenId).innerHTML);
      this.hintsRegistry.removeHintsAtLocation(this.location, this.hrId, this.info.who);
      this.get('editor').replaceNodeWithHTML(this.getDomNodeToUpdate(this.info.domReference.value), html);
      this.get('editor').replaceNodeWithHTML(this.findBvapContainer(), this.insertBvaps());
    },

    togglePopup(){
      this.toggleProperty('popup');
    }
  }
});
