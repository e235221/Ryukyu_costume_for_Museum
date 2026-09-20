import assert from 'node:assert/strict';
import {composePhoto,drawCover,photoFilename} from './photo-capture.mjs';

const operations=[];
const context={
  clearRect(...args){operations.push(['clear',...args]);},
  save(){operations.push(['save']);},
  restore(){operations.push(['restore']);},
  translate(...args){operations.push(['translate',...args]);},
  scale(...args){operations.push(['scale',...args]);},
  drawImage(...args){operations.push(['draw',...args]);}
};
const output={getContext:()=>context};
const video={readyState:4,videoWidth:1280,videoHeight:720};
const background={width:960,height:640};
const costumes={width:390,height:844};

composePhoto(output,{video,backgroundCanvas:null,costumeCanvas:costumes,width:390,height:844});
assert.equal(output.width,390);assert.equal(output.height,844);
assert(operations.some(op=>op[0]==='scale'&&op[1]===-1&&op[2]===1),'camera must be mirrored like the preview');
assert.equal(operations.filter(op=>op[0]==='draw').at(-1)[1],costumes,'costumes must be the last layer');

operations.length=0;
composePhoto(output,{video,backgroundCanvas:background,costumeCanvas:costumes,width:390,height:844});
const draws=operations.filter(op=>op[0]==='draw');
assert.equal(draws[0][1],background,'processed background/person canvas must replace raw video');
assert.equal(draws[1][1],costumes);
assert(!draws.some(op=>op[1]===video),'raw video must not cover the processed background');

assert.throws(()=>drawCover(context,{width:0,height:0},390,844),/サイズ/);
assert.equal(photoFilename(new Date(2026,8,20,12,34,56)),'ryukyu-ar-20260920-123456.png');
console.log('PASS: mirrored camera/background, costume layer order, invalid source guard, timestamped filename.');
