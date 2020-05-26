import EmberObject from '@ember/object';

export default function copyEmberObject(obj) {
  const result = {};
  Object.keys(obj)
    .filter( (k) => k !== "_super" )
    .forEach( (k) => result[k] = obj[k] );
  return EmberObject.create( result );
}
