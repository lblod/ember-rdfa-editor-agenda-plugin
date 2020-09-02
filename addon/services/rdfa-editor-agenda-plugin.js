import Service from '@ember/service';
import EmberObject from '@ember/object';
import { task } from 'ember-concurrency';
import { warn } from '@ember/debug';

const ext = 'http://mu.semte.ch/vocabularies/ext/';

/**
 * Service responsible for management of agenda
 *
 *  ASSUMPTIONS (to be checked)
 *  --------------------------
 *  - no bestuursorgaan
 *
 * @module editor-agenda-plugin
 * @class RdfaEditorAgendaPlugin
 * @constructor
 * @extends EmberService
 */
const RdfaEditorAgendaPlugin = Service.extend({
  insertAgendaText: 'http://mu.semte.ch/vocabularies/ext/insertAgendaText',
  agendapuntenTable: 'http://mu.semte.ch/vocabularies/ext/agendapuntenTable',

  /**
   * Task to handle the incoming events from the editor dispatcher
   *
   * @method execute
   *
   * @param {string} hrId Unique identifier of the event in the hintsRegistry
   * @param {Array} contexts RDFa contexts of the text snippets the event applies on
   * @param {Object} hintsRegistry Registry of hints in the editor
   * @param {Object} editor The RDFa editor instance
   *
   * @public
   */
  execute: task(function * (hrId, contexts, hintsRegistry, editor) {
    if (contexts.length === 0) return;

    const hints = [];

    for(let context of contexts){
      let triple = this.detectRelevantContext(context);

      if(!triple) continue;

      let domNode = this.findDomNodeForContext(editor, context, this.domNodeMatchesRdfaInstructive(triple));

      if(!domNode) continue;

      if(triple.predicate == this.insertAgendaText){
        hintsRegistry.removeHintsInRegion(context.region, hrId, this.who);
        hints.pushObjects(this.generateHintsForContext(context, triple, domNode, editor));
      }

      let domNodeRegion = [ editor.getRichNodeFor(domNode).start, editor.getRichNodeFor(domNode).end ];
      //sometimes it gets a double hint
      if(triple.predicate == this.agendapuntenTable && !hints.find(h => h.location[0] == domNodeRegion[0] && h.location[1] == domNodeRegion[1])){
        hintsRegistry.removeHintsInRegion(domNodeRegion, hrId, this.who);
        hints.pushObjects(this.generateHintsForContext(context, triple, domNode, editor));
      }

    }

    const cards = hints.map( (hint) => this.generateCard(hrId, hintsRegistry, editor, hint, this.who));
    if(cards.length > 0){
      hintsRegistry.addHints(hrId, this.who, cards);
    }
  }),

  /**
   * Given context object, tries to detect a context the plugin can work on
   *
   * @method detectRelevantContext
   *
   * @param {Object} context Text snippet at a specific location with an RDFa context
   *
   * @return {String} URI of context if found, else empty string.
   *
   * @private
   */
  detectRelevantContext(context){
    if(context.context.slice(-1)[0].predicate == this.insertAgendaText){
      return context.context.slice(-1)[0];
    }
    if(context.context.slice(-1)[0].predicate == this.agendapuntenTable){
      return context.context.slice(-1)[0];
    }
    return null;
  },

  /**
   * Maps location of substring back within reference location
   *
   * @method normalizeLocation
   *
   * @param {[int,int]} [start, end] Location withing string
   * @param {[int,int]} [start, end] reference location
   *
   * @return {[int,int]} [start, end] absolute location
   *
   * @private
   */
  normalizeLocation(location, reference){
    return [location[0] + reference[0], location[1] + reference[0]];
  },

  /**
   * Generates a card given a hint
   *
   * @method generateCard
   *
   * @param {string} hrId Unique identifier of the event in the hintsRegistry
   * @param {Object} hintsRegistry Registry of hints in the editor
   * @param {Object} editor The RDFa editor instance
   * @param {Object} hint containing the hinted string and the location of this string
   *
   * @return {Object} The card to hint for a given template
   *
   * @private
   */
  generateCard(hrId, hintsRegistry, editor, hint, cardName){
    return EmberObject.create({

      info: {
        location: hint.location,
        tableUri: hint.domReference.value.replace('ext:', ext),
        editMode: hint.options.editMode,
        hrId, hintsRegistry, editor
      },

      location: hint.location,
      options: hint.options,
      card: cardName

    });
  },

  /**
   * Generates a hint, given a context
   *
   * @method generateHintsForContext
   *
   * @param {Object} context Text snippet at a specific location with an RDFa context
   *
   * @return {Object} [{dateString, location}]
   *
   * @private
   */
  generateHintsForContext(context, instructiveTriple, domNode, editor, options = {}){
    const hints = [];
    let location = context.region;
    //we keep only reference, domNode might not be attached when being used
    //note: we assume here only one agenda in document
    let domReference = domNode.attributes.property;

    if(instructiveTriple.predicate == this.agendapuntenTable){
      location = [ editor.getRichNodeFor(domNode).start, editor.getRichNodeFor(domNode).end ];
      options.noHighlight = true;
      options.editMode = true;
    }

    hints.push({location, domReference, instructiveUri: instructiveTriple.predicate, options});
    return hints;
  },

  /**************************************************************************************
   * HELPERS
   **************************************************************************************/
  ascendDomNodesUntil(rootNode, domNode, condition){
    if(!domNode || rootNode.isEqualNode(domNode)) return null;
    if(!condition(domNode))
      return this.ascendDomNodesUntil(rootNode, domNode.parentElement, condition);
    return domNode;
  },

  domNodeMatchesRdfaInstructive(instructiveRdfa){
    return (domNode) => {
      if(!domNode.attributes || !domNode.attributes.property)
        return false;
      let expandedProperty = domNode.attributes.property.value.replace('ext:', ext);
      if(instructiveRdfa.predicate == expandedProperty)
        return true;
      return false;
    };
  },

  findDomNodeForContext(editor, context, condition){
    const domNode = context.richNodes
          .map(r => this.ascendDomNodesUntil(editor.rootNode, r.domNode, condition))
          .find(d => d);
    if(!domNode){
      warn(`Trying to work on unattached domNode. Sorry can't handle these...`, {id: 'agendaPlugin.domNode'});
    }
    return domNode;
  }

});

RdfaEditorAgendaPlugin.reopen({
  who: 'editor-plugins/agenda-card'
});
export default RdfaEditorAgendaPlugin;
