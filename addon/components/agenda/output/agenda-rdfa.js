import Component from '@ember/component';
import layout from '../../../templates/components/agenda/output/agenda-rdfa';
import { computed } from '@ember/object';

export default Component.extend({
  layout,
  sortedAP: computed('agendapunten,agendapunten.[],agendapunten.@each.vorigeAgendapunt,agendapunten.@each.vorigeAgendapunt.@each.uri', function(){
    return this.agendapunten;
  })
});
