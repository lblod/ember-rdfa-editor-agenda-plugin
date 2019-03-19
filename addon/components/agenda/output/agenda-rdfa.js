import Component from '@ember/component';
import layout from '../../../templates/components/agenda/output/agenda-rdfa';
import { alias } from '@ember/object/computed';

export default Component.extend({
  layout,
  sortedAP: alias('agendapunten')
});
