import Component from '@ember/component';
import layout from '../../../templates/components/agenda/table/agendapunten-table';

export default Component.extend({
  layout,

  actions: {
    edit(row){
      this.onEdit(row);
    },

    create(){
      this.onCreate();
    }
  }
});
