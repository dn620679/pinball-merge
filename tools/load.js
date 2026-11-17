// node에서 브라우저용 스크립트를 로드하는 도우미
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function load(files) {
  for (const f of files) vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), { filename: f });
  return globalThis.PM;
};
