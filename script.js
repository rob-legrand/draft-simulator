/*jslint browser: true, indent: 3 */

document.addEventListener('DOMContentLoaded', function () {
   'use strict';
   var createDraft, draft;

   createDraft = function (numPicks, oldState) {
      var o, s, whichPick;
      o = {
         getNumPicks: function () {
            return s.numPicks;
         },
         getNumPicksMade: function () {
            return s.numPicksMade;
         },
         randomize: function () {
            var hasBeenUsed;
            hasBeenUsed = [];
            s.picks.forEach(function (pick) {
               pick.prefs = [];
               do {
                  pick.prefs[0] = Math.floor(Math.random() * 101);
               } while (hasBeenUsed[pick.prefs[0]]);
               hasBeenUsed[pick.prefs[0]] = true;
               do {
                  pick.prefs[1] = Math.floor(Math.random() * 101);
               } while (hasBeenUsed[pick.prefs[1]]);
               hasBeenUsed[pick.prefs[1]] = true;
            });
            o.resetPicks();
         },
         resetPicks: function () {
            s.numPicksMade = 0;
            s.picks.forEach(function (pick) {
               pick.pickedBy = 0;
            });
            o.save();
         },
         getPreference: function (whichPicker, whichPick) {
            return s.picks[whichPick].prefs[whichPicker - 1];
         },
         hasBeenPicked: function (whichPick) {
            return s.picks[whichPick].pickedBy > 0;
         },
         whoPicked: function (whichPick) {
            return s.picks[whichPick].pickedBy;
         },
         isFinished: function () {
            return s.numPicksMade >= s.numPicks;
         },
         whoPicksNext: function () {
            return o.isFinished() ? 0 : s.numPicksMade % 2 + 1;
         },
         makePick: function (whichPick) {
            var hasBeenPicked, numPicksLeft, whoPicksNext;
            if (o.isFinished()) {
               return false;
            }
            if (typeof whichPick !== 'number') {
               if (whichPick === 'minimax') {
                  hasBeenPicked = [];
                  numPicksLeft = 0;
                  s.picks.forEach(function (ignore, index) {
                     hasBeenPicked.push(o.hasBeenPicked(index));
                     if (!o.hasBeenPicked(index)) {
                        numPicksLeft += 1;
                     }
                  });
                  whoPicksNext = 0;
                  while (numPicksLeft > 0) {
                     whichPick = 0;
                     s.picks.forEach(function (pick, index) {
                        if (!hasBeenPicked[index] && (hasBeenPicked[whichPick] || pick.prefs[whoPicksNext] < s.picks[whichPick].prefs[whoPicksNext])) {
                           whichPick = index;
                        }
                     });
                     hasBeenPicked[whichPick] = true;
                     numPicksLeft -= 1;
                     whoPicksNext = 1 - whoPicksNext;
                  }
               } else if (whichPick === 'antigreedy') {
                  var bestTwo = [0, 0];
                  whichPick = 0;
                  s.picks.forEach(function (pick, index) {
                     if (!o.hasBeenPicked(index) && (o.hasBeenPicked(whichPick) || pick.prefs[2 - o.whoPicksNext()] > s.picks[whichPick].prefs[2 - o.whoPicksNext()])) {
                        whichPick = index;
                     }
                  });
                  if (o.getNumPicksMade() < o.getNumPicks() - 1) {
                     bestTwo[0] = whichPick;
                     whichPick = whichPick === 0 ? 1 : 0;
                     s.picks.forEach(function (pick, index) {
                        if (index !== bestTwo[0] && !o.hasBeenPicked(index) && (o.hasBeenPicked(whichPick) || pick.prefs[2 - o.whoPicksNext()] > s.picks[whichPick].prefs[2 - o.whoPicksNext()])) {
                           whichPick = index;
                        }
                     });
                     bestTwo[1] = whichPick;
                     whichPick = bestTwo[s.picks[bestTwo[0]].prefs[o.whoPicksNext() - 1] > s.picks[bestTwo[1]].prefs[o.whoPicksNext() - 1] ? 0 : 1];
                  }
               } else if (whichPick === 'popular') {
                  whichPick = 0;
                  s.picks.forEach(function (pick, index) {
                     if (!o.hasBeenPicked(index) && (o.hasBeenPicked(whichPick) || pick.prefs[0] + pick.prefs[1] > s.picks[whichPick].prefs[0] + s.picks[whichPick].prefs[1])) {
                        whichPick = index;
                     }
                  });
               } else {
                  whichPick = 0;
                  s.picks.forEach(function (pick, index) {
                     if (!o.hasBeenPicked(index) && (o.hasBeenPicked(whichPick) || pick.prefs[o.whoPicksNext() - 1] > s.picks[whichPick].prefs[o.whoPicksNext() - 1])) {
                        whichPick = index;
                     }
                  });
               }
            }
            if (o.hasBeenPicked(whichPick)) {
               return false;
            }
            s.picks[whichPick].pickedBy = o.whoPicksNext();
            s.numPicksMade += 1;
            o.save();
            return true;
         },
         save: function () {
            var jsonString;
            if (!localStorage) {
               return false;
            }
            jsonString = JSON.stringify(s);
            localStorage.setItem('draft', jsonString);
            return localStorage.getItem('draft') === jsonString;
         }
      };
      s = typeof oldState === 'string' ? JSON.parse(oldState) : {};
      if (s.numPicks !== numPicks) {
         s = {
            numPicks: numPicks,
            numPicksMade: 0,
            picks: []
         };
         for (whichPick = 0; whichPick < numPicks; whichPick += 1) {
            s.picks.push({
               pickedBy: 0,
               prefs: [0, 0]
            });
         }
         o.randomize();
      }
      return o;
   };

   (function () {
      var pickButtons, preference1Elements, preference2Elements, updatePage;

      pickButtons = Array.prototype.slice.call(document.getElementsByClassName('make-pick'));
      preference1Elements = Array.prototype.slice.call(document.getElementsByClassName('preference-1'));
      preference2Elements = Array.prototype.slice.call(document.getElementsByClassName('preference-2'));

      updatePage = function (draft) {
         var preferenceTotal, updatePreferenceElement;
         document.getElementById('turn').textContent = draft.isFinished() ?  'The draft has concluded.' : 'Picker ' + draft.whoPicksNext() + '\'s turn to pick:';
         pickButtons.forEach(function (pickButton, whichPick) {
            pickButton.disabled = draft.hasBeenPicked(whichPick);
         });
         document.getElementById('pick-greedy').disabled = draft.isFinished();
         document.getElementById('pick-antigreedy').disabled = draft.isFinished();
         document.getElementById('pick-popular').disabled = draft.isFinished();
         document.getElementById('pick-minimax').disabled = draft.isFinished();
         updatePreferenceElement = function (whichPicker, element, whichPick) {
            var preference;
            preference = draft.getPreference(whichPicker, whichPick);
            element.textContent = preference;
            element.style.backgroundColor = 'rgb(' + Math.round((1 - preference / 100) * 255) + ', ' + Math.round(preference / 100 * 255) + ', 85)';
            element.classList.remove('picked-by-self');
            element.classList.remove('picked-by-opponent');
            element.classList.add(draft.whoPicked(whichPick) === whichPicker ? 'picked-by-self' : 'picked-by-opponent');
         };
         preferenceTotal = 0;
         preference1Elements.forEach(function (element, whichPick) {
            updatePreferenceElement(1, element, whichPick);
            if (draft.whoPicked(whichPick) === 1) {
               preferenceTotal += draft.getPreference(1, whichPick);
            }
         });
         document.getElementsByClassName('preference-total-1')[0].textContent = preferenceTotal;
         preferenceTotal = 0;
         preference2Elements.forEach(function (element, whichPick) {
            updatePreferenceElement(2, element, whichPick);
            if (draft.whoPicked(whichPick) === 2) {
               preferenceTotal += draft.getPreference(2, whichPick);
            }
         });
         document.getElementsByClassName('preference-total-2')[1].textContent = preferenceTotal;
      };

      pickButtons.forEach(function (pickButton, whichPick) {
         pickButton.addEventListener('click', function () {
            draft.makePick(whichPick);
            updatePage(draft);
         }, false);
      });

      document.getElementById('pick-greedy').addEventListener('click', function () {
         draft.makePick('greedy');
         updatePage(draft);
      }, false);

      document.getElementById('pick-antigreedy').addEventListener('click', function () {
         draft.makePick('antigreedy');
         updatePage(draft);
      }, false);

      document.getElementById('pick-popular').addEventListener('click', function () {
         draft.makePick('popular');
         updatePage(draft);
      }, false);

      document.getElementById('pick-minimax').addEventListener('click', function () {
         draft.makePick('minimax');
         updatePage(draft);
      }, false);

      document.getElementById('reset-picks').addEventListener('click', function () {
         draft.resetPicks();
         updatePage(draft);
      }, false);

      document.getElementById('reset-all').addEventListener('click', function () {
         draft = createDraft(pickButtons.length);
         draft.save();
         updatePage(draft);
      }, false);

      if (localStorage && localStorage.getItem('draft')) {
         draft = createDraft(pickButtons.length, localStorage.getItem('draft'));
      } else {
         draft = createDraft(pickButtons.length);
         draft.save();
      }
      updatePage(draft);
   }());

}, false);
