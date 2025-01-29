/*jslint browser: true, indent: 3 */

document.addEventListener('DOMContentLoaded', function () {
   'use strict';
   var computerChoose, makePick, picks;

   picks = Array.prototype.slice.call(document.getElementsByClassName('pick'));
   document.getElementById('turn').textContent = 'human\'s turn';

   computerChoose = function () {
      var i;
      for (i = 0; i < picks.length; i += 1) {
         if (picks[i].textContent.charAt(0) === 'P') {
            return i;
         }
      }
   };

   computerChoose = function () {
      var pick;
      picks.some(function (element, index) {
         if (element.textContent.charAt(0) === 'P') {
            pick = index;
            return true;
         }
         return false;
      });
      return pick;
   };

   computerChoose = function () {
      var pick;
      if (picks.some(function (element, index) {
         pick = index;
         return element.textContent.charAt(0) === 'P';
      })) {
         return pick;
      }
   };

   computerChoose = function () {
      var didFindOne, pick;
      didFindOne = picks.some(function (element, index) {
         pick = index;
         return element.textContent.charAt(0) === 'P';
      });
      if (didFindOne) {
         return pick;
      }
   };

   computerChoose = function () {
      var pick;
      pick = 0;
      picks.forEach(function (element, index) {
         if (element.textContent.charAt(0) === 'P') {
            pick = index;
         }
      });
      return pick;
   };

   makePick = function (chooser, player) {
      document.getElementById('pick' + player).textContent = chooser + ' picked ' + player;
      if (chooser === 'human') {
         picks.forEach(function (element) {
            element.disabled = true;
         });
         document.getElementById('turn').textContent = 'computer\'s turn';
         window.setTimeout(function () {
            makePick('computer', computerChoose());
            picks.forEach(function (element) {
               element.disabled = element.textContent.charAt(0) !== 'P';
            });
            document.getElementById('turn').textContent = picks.every(function (element) {
               return element.disabled;
            }) ? 'finished' : 'human\'s turn';
         }, Math.random() * 800 + 200);
      }
   };

   picks.forEach(function (element, index) {
      element.addEventListener('click', function () {
         makePick('human', index);
      }, false);
   });

}, false);
