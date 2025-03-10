/*jslint browser */

document.addEventListener('DOMContentLoaded', function () {
   'use strict';

   const localStorageKey = 'draft-simulator';

   const createDraft = function (numPicks, oldState) {
      let s;

      const o = {
         getNumPicks: function () {
            return s.numPicks;
         },
         getNumPicksMade: function (whichPicker) {
            if (whichPicker === 1 || whichPicker === 2) {
               return s.numPicksMade[whichPicker - 1];
            }
            return s.numPicksMade[0] + s.numPicksMade[1];
         },
         randomize: function () {
            let hasBeenUsed;
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
            s.numPicksMade = [0, 0];
            s.picks.forEach(function (pick) {
               pick.pickedBy = 0;
            });
            o.save();
         },
         swapPreferences: function () {
            o.resetPicks();
            s.picks.forEach(function (pick) {
               const tempPref = pick.prefs[0];
               pick.prefs[0] = pick.prefs[1];
               pick.prefs[1] = tempPref;
            });
            o.save();
         },
         getPreference: function (whichPicker, whichPick) {
            return s.picks[whichPick].prefs[whichPicker - 1];
         },
         getPreferenceTotal: function (whichPickersPreferences, whichPickersPicks) {
            let total;
            total = 0;
            s.picks.forEach(function (pick) {
               if (pick.pickedBy === whichPickersPicks) {
                  total += pick.prefs[whichPickersPreferences - 1];
               }
            });
            return total;
         },
         hasBeenPicked: function (whichPick) {
            return s.picks[whichPick].pickedBy > 0;
         },
         whoPicked: function (whichPick) {
            return s.picks[whichPick].pickedBy;
         },
         isFinished: function () {
            return o.getNumPicksMade() >= o.getNumPicks();
         },
         whoPicksNext: function () {
            return (
               o.isFinished()
               ? 0
               : o.getNumPicksMade(1) <= o.getNumPicksMade(2)
               ? 1
               : 2
            );
         },
         makePick: function (whichPick, whichPicker) {
            let hasBeenPicked;
            let numPicksLeft;
            let whoPicksNext;
            if (
               o.isFinished()
               || (
                  typeof whichPicker === 'number'
                  && whichPicker !== o.whoPicksNext()
               )
            ) {
               return false;
            }
            whichPicker = o.whoPicksNext();
            if (typeof whichPick !== 'number') {
               if (whichPick === 'optimal') {
                  hasBeenPicked = [];
                  numPicksLeft = 0;
                  s.picks.forEach(function (ignore, index) {
                     hasBeenPicked.push(o.hasBeenPicked(index));
                     if (!o.hasBeenPicked(index)) {
                        numPicksLeft += 1;
                     }
                  });
                  whoPicksNext = 0;
                  const findPick = function (pick, index) {
                     if (
                        !hasBeenPicked[index]
                        && (
                           hasBeenPicked[whichPick]
                           || pick.prefs[whoPicksNext] < s.picks[whichPick].prefs[whoPicksNext]
                        )
                     ) {
                        whichPick = index;
                     }
                  };
                  while (numPicksLeft > 0) {
                     whichPick = 0;
                     s.picks.forEach(findPick);
                     hasBeenPicked[whichPick] = true;
                     numPicksLeft -= 1;
                     whoPicksNext = 1 - whoPicksNext;
                  }
               } else {
                  whichPick = 0;
                  s.picks.forEach(function (pick, index) {
                     if (
                        !o.hasBeenPicked(index)
                        && (
                           o.hasBeenPicked(whichPick)
                           || pick.prefs[whichPicker - 1] > s.picks[whichPick].prefs[whichPicker - 1]
                        )
                     ) {
                        whichPick = index;
                     }
                  });
               }
            }
            if (o.hasBeenPicked(whichPick)) {
               return false;
            }
            s.picks[whichPick].pickedBy = whichPicker;
            s.numPicksMade[whichPicker - 1] += 1;
            o.save();
            return true;
         },
         save: function () {
            if (!localStorage) {
               return false;
            }
            const jsonString = JSON.stringify(s);
            localStorage.setItem(localStorageKey, jsonString);
            return localStorage.getItem(localStorageKey) === jsonString;
         }
      };
      s = (
         typeof oldState === 'string'
         ? JSON.parse(oldState)
         : {}
      );
      if (s.numPicks !== numPicks) {
         s = {
            numPicks: numPicks,
            numPicksMade: [0, 0],
            picks: Array.from(
               {length: numPicks},
               () => ({
                  pickedBy: 0,
                  prefs: [0, 0]
               })
            )
         };
         o.randomize();
      }
      return o;
   };

   (function () {
      let draft;

      const pickedBy1Elements = [...document.querySelectorAll('.picked-by-1 .preference')];
      const preference1Elements = [...document.querySelectorAll('.unpicked-by-1 .preference')];
      const preference2Elements = [...document.querySelectorAll('.unpicked-by-2 .preference')];
      const pickedBy2Elements = [...document.querySelectorAll('.picked-by-2 .preference')];

      const updatePage = function (draft) {
         [...document.querySelectorAll('.next-to-pick')].forEach(function (element, index) {
            element.style.visibility = (
               draft.whoPicksNext() === index + 1
               ? ''
               : 'hidden'
            );
         });
         document.querySelector('#pick-1-greedy').disabled = draft.whoPicksNext() !== 1;
         document.querySelector('#pick-1-optimal').disabled = draft.whoPicksNext() !== 1;
         document.querySelector('#pick-2-greedy').disabled = draft.whoPicksNext() !== 2;
         document.querySelector('#pick-2-optimal').disabled = draft.whoPicksNext() !== 2;
         const updatePreferenceElement = function (whichPicker, element, whichPick) {
            const preference = draft.getPreference(whichPicker, whichPick);
            element.textContent = preference;
            element.style.backgroundColor = (
               'rgb(' + Math.round((1 - preference / 100) * 255)
               + ', ' + Math.round(preference / 100 * 255) + ', 85)'
            );
            if (draft.whoPicked(whichPick) === (
               whichPicker === 1
               ? 2
               : 1
            )) {
               element.classList.add('pick-missed');
            } else {
               element.classList.remove('pick-missed');
            }
            if (draft.whoPicked(whichPick) === 0 && draft.whoPicksNext() === whichPicker) {
               element.classList.add('pick-pickable');
            } else {
               element.classList.remove('pick-pickable');
            }
         };
         pickedBy1Elements.forEach(function (element, whichPick) {
            updatePreferenceElement(1, element, whichPick);
            element.style.visibility = (
               draft.whoPicked(whichPick) === 1
               ? ''
               : 'hidden'
            );
         });
         preference1Elements.forEach(function (element, whichPick) {
            updatePreferenceElement(1, element, whichPick);
            element.style.visibility = (
               draft.whoPicked(whichPick) === 1
               ? 'hidden'
               : ''
            );
         });
         preference2Elements.forEach(function (element, whichPick) {
            updatePreferenceElement(2, element, whichPick);
            element.style.visibility = (
               draft.whoPicked(whichPick) === 2
               ? 'hidden'
               : ''
            );
         });
         pickedBy2Elements.forEach(function (element, whichPick) {
            updatePreferenceElement(2, element, whichPick);
            element.style.visibility = (
               draft.whoPicked(whichPick) === 2
               ? ''
               : 'hidden'
            );
         });
         const updatePreferenceTotals = function (whichPickersPreferences, whichPickersPicks) {
            let preferenceTotal;
            const preferenceTotalElements = [...document.querySelectorAll('.picker-' + whichPickersPreferences + '-info .preference')];
            const preferenceTotalElement = preferenceTotalElements[
               whichPickersPreferences === whichPickersPicks
               ? 0
               : 1
            ];
            preferenceTotal = draft.getPreferenceTotal(whichPickersPreferences, whichPickersPicks);
            preferenceTotalElement.textContent = preferenceTotal;
            preferenceTotal /= draft.getNumPicksMade(whichPickersPicks);
            preferenceTotalElement.style.backgroundColor = (
               Number.isFinite(preferenceTotal)
               ? 'rgb(' + Math.round((1 - preferenceTotal / 100) * 255) + ', ' + Math.round(preferenceTotal / 100 * 255) + ', 85)'
               : ''
            );
         };
         updatePreferenceTotals(1, 1);
         updatePreferenceTotals(1, 2);
         updatePreferenceTotals(2, 2);
         updatePreferenceTotals(2, 1);
         document.querySelector('#draft-complete').style.visibility = (
            draft.isFinished()
            ? ''
            : 'hidden'
         );
      };

      preference1Elements.forEach(function (preference1Element, whichPick) {
         preference1Element.addEventListener('click', function () {
            draft.makePick(whichPick, 1);
            updatePage(draft);
         });
      });

      preference2Elements.forEach(function (preference2Element, whichPick) {
         preference2Element.addEventListener('click', function () {
            draft.makePick(whichPick, 2);
            updatePage(draft);
         });
      });

      document.querySelector('#pick-1-greedy').addEventListener('click', function () {
         draft.makePick('greedy', 1);
         updatePage(draft);
      });

      document.querySelector('#pick-1-optimal').addEventListener('click', function () {
         draft.makePick('optimal', 1);
         updatePage(draft);
      });

      document.querySelector('#pick-2-greedy').addEventListener('click', function () {
         draft.makePick('greedy', 2);
         updatePage(draft);
      });

      document.querySelector('#pick-2-optimal').addEventListener('click', function () {
         draft.makePick('optimal', 2);
         updatePage(draft);
      });

      document.querySelector('#reset-picks').addEventListener('click', function () {
         draft.resetPicks();
         updatePage(draft);
      });

      document.querySelector('#swap-preferences').addEventListener('click', function () {
         draft.swapPreferences();
         updatePage(draft);
      });

      document.querySelector('#reset-all').addEventListener('click', function () {
         draft = createDraft(pickedBy1Elements.length);
         draft.save();
         updatePage(draft);
      });

      if (localStorage && localStorage.getItem(localStorageKey)) {
         draft = createDraft(pickedBy1Elements.length, localStorage.getItem(localStorageKey));
      } else {
         draft = createDraft(pickedBy1Elements.length);
         draft.save();
      }
      updatePage(draft);
   }());

});
