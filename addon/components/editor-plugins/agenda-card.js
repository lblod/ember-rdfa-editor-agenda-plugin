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
 *  - always a zitting
 * TODO
 * -----
 * - display agendapunt numbering
 * - fix variables where variables could be useful
 * - working on temp objects should be easier then cloning it
 * - onCreate user should set order immediatly...(disabled it because no time)
 * - Code will break when there is an agendapunt with no behandling attached to it. (wich is possible in the model)
 *
 * SOME IMPLEMENTATION NOTES
 * -------------------------
 *  There is currently an asymmetry between how the behandelingen van agendapunt and agendapunten are managed by the code.
 *   - Agendapunten is managed by Marawa. The domnode of agendapunten is provided to Marawa. We get triples in return.
 *     These triples are serialized with the metamodel utils to ember objects which we can reason on.
 *
 *   - Behandelingen van agendpunten is manualy managed. Why? Merley because performance conisderations. If we'd provide the domnodes
 *     of behandelingen of agendapunten to Marawa, the number of triples would explode and the browser would freeze.
 *
 *     This problem is a general problem which will most likely be tackled by having a fronted triples store we can query on.
 *
 *
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

      //Here an additional fake property to set bvapOpenbaar value
      agendapunten.forEach(a => a.set('bvapOpenbaar', this.getBvapOpenbaarValue(a)));
      this.set('agendapunten', agendapunten);
    }
    else
      this.set('agendapunten', A([]));
  }),

  getBvapOpenbaarValue(agendapunt){
    let agendapuntUri = agendapunt.get('uri');
    let bvaps = [ ...this.findbvapDomNodes() ];
    let bvapDom = bvaps.find(bvap => bvap.querySelector("[property='dc:subject']").getAttribute('resource') == agendapuntUri);
    if(!bvapDom) return false;
    let openbaarDom = bvapDom.querySelector('[property="besluit:openbaar"]');
    if(!openbaarDom) return false;
    return openbaarDom.getAttribute('content') == 'true';
  },

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
        <span property="dc:subject" resource="${agendapunt.uri}">Agendapunt -</span>&nbsp;
        <span property="besluit:openbaar" datatype="xsd:boolean" content="${agendapunt.bvapOpenbaar}">
          <i class="fa ${agendapunt.bvapOpenbaar?'fa-eye':'fa-eye-slash'}"></i>
          <span>${agendapunt.bvapOpenbaar?'Openbare behandeling':'Besloten behandeling'}</span>
        </span>
        <p property=ext:behandelingVanAgendapuntTitel> ${agendapunt.titel} </p>
        <br>
        <br>
        <h3 class="h6">Aanwezigen bij agendapunt</h3>
        <br>
        <div property="ext:insertAanwezigenText">Beheer aanwezigen bij agendapunt</div>
        <br>
        <br>
        <div property="ext:insertStemmingText">Beheer de stemmingen bij dit agendapunt</div>
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

    let html = `<span style="display:none;" property="besluit:gebeurtNa" resource="${previous.getAttribute('resource')}">&nbsp;</span>`;
    bvap.prepend(this.createElementsFromHTML(html)[0]);
  },

  updateOpenbaarBvap(bvapDom, openbaar){
    let openbaarDom = bvapDom.querySelector('[property="besluit:openbaar"]');
    if(!openbaarDom) return;
    openbaarDom.setAttribute('content', openbaar);
    openbaarDom.innerHTML = `
          <i class="fa ${openbaar ?'fa-eye':'fa-eye-slash'}"></i>
          <span>${openbaar ?'Openbare behandeling':'Besloten behandeling'}</span>
    `;
  },

  insertBvaps(){
    let bvaps = [ ...this.findbvapDomNodes() ];
    let bvapsMap = {};
    bvaps.forEach(ap => bvapsMap[ap.querySelector("[property='dc:subject']").getAttribute('resource')] = ap );

    //clean up
    bvaps.forEach(ap => ap.remove());

    //set order of bvaps + update openbaar of bvap
    let newBvaps = [];
    this.agendapunten.forEach(ap => {
      let bvapDom = bvapsMap[ap.uri];

      if(bvapDom){
        this.updateOpenbaarBvap(bvapDom, ap.bvapOpenbaar);
        newBvaps.push(bvapDom);
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
