import { reads } from '@ember/object/computed';
import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/agenda-card';
import { task } from 'ember-concurrency';
import { A } from '@ember/array';
import uuid from 'uuid/v4';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import RdfaContextScanner from '@lblod/marawa/dist/rdfa-context-scanner';

/**
 * Card displaying a hint of the Date plugin
 *  ASSUMPTIONS (to be checked)
 *  --------------------------
 *  - only one agenda to zitting
 *  - always a zitting
 *  - behandelingen van agendapunt linked to zitting! (through ext)
 * TODO
 * -----
 * - display agendapunt numbering
 * - fix variables where variables could be useful
 * - working on temp objects should be easier then cloning it
 * - onCreate user should set order immediatly...(disabled it because no time)
 *
 *
 * @module editor-agenda-plugin
 * @class AgendaCard
 * @extends Ember.Component
 */
export default Component.extend({
  layout,
  tripleSerialization: service('triplesSerializationUtils'),

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

  serializeTableToTriples(table){
    const contextScanner = new RdfaContextScanner();
    const contexts = contextScanner.analyse(table, []).map((c) => c.context);
    return Array.concat(...contexts);
  },

  loadData: task(function *(){
    if(this.info.editMode){
      //TODO: performance: avoid duplicate triples
      let triples = this.serializeTableToTriples(this.getDomNodeToUpdate(this.info.domReference.value));
      //TODO: trim on other level
      triples.forEach(t => t.object = typeof t.object == "string" && t.object.trim());
      let agendapunten = yield this.tripleSerialization.getAllResourcesForType('http://data.vlaanderen.be/ns/besluit#Agendapunt', triples, true);
      agendapunten.forEach(a => a.geplandOpenbaar = a.geplandOpenbaar == 'true' || a.geplandOpenbaar == true);
      this.set('agendapunten', agendapunten);
    }
    else
      this.set('agendapunten', A([]));
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
    let bvap  = bvapDom.querySelector("[property='besluit:gebeurtNa']");
    if(!bvap)
      bvap = bvapDom.querySelector("[typeof='http://data.vlaanderen.be/ns/besluit#gebeurtNa']");
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
         <span property="besluit:openbaar" datatype="xsd:boolean" content="true">
           <i class="fa ${agendapunt.geplandOpenbaar?'fa-eye':'fa-eye-slash'}"></i>
         </span>
         <span property="dc:subject" resource="${agendapunt.uri}">
           <span>Agendapunt</span>
         </span>
         <br>
         <h3 class="h6">Aanwezigen bij agendapunt</h3>
         <br>
         <div property="ext:insertAanwezigenText"><mark data-editor-highlight="true">Beheer aanwezigen bij agendapunt</mark></div>
         <br>
         <br>
         <div>Voeg sjabloon in</div>
         <br>
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

    if(node){
      node.setAttribute('resource', previous.getAttribute('resource'));
      return;
    }

    let html = `<meta property="besluit:gebeurtNa" resource="${previous.getAttribute('resource')}">`;
    bvap.prepend(this.createElementsFromHTML(html)[0]);
  },

  insertBvaps(){
    let bvaps = [ ...this.findbvapDomNodes() ];
    let bvapsMap = {};
    bvaps.forEach(ap => bvapsMap[ap.querySelector("[property='dc:subject']").getAttribute('resource')] = ap );

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
    let allBvaps = newBvaps.map(b => b.outerHTML).join('&nbsp;');
    return this.createWrappingHTML(allBvaps, 'ext:behandelingVanAgendapuntenContainer');
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
