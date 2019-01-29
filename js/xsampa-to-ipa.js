var baseMap;
var diacriticStart;
var combiningDiacs;
var nonCombiningDiacs;

var jsonReq = new XMLHttpRequest();
jsonReq.open("GET", "./js/conversion-data.json");
jsonReq.responseType = "json";
jsonReq.onload = function() {
  baseMap = jsonReq.response.baseSymbols;
  combiningDiacs = jsonReq.response.diacritics.combining;
  nonCombiningDiacs = jsonReq.response.diacritics.noncombining;
  diacriticStart = jsonReq.response.diacriticStartChars;
}
jsonReq.send();

function xsBaseToIpaBase(xsBase) {
  if (baseMap.hasOwnProperty(xsBase))
    return baseMap[xsBase];
  else
    return xsBase;
}

function convertBase(str, i) {
  var xsBase = str[i++];

  if (str[i] == "\\" && baseMap.hasOwnProperty(xsBase + "\\")) {
    xsBase += str[i++];

    if (xsBase == "|\\" && str.slice(i, i+2) == "|\\") {
      xsBase = "|\\|\\";
      i += 2;
    }
  }

  return [xsBase, xsBaseToIpaBase(xsBase), i];
}

function convertDiacritics(str, i, xsBase, ipaBase) {
  var xsDiac, ipaCombDiacs = "", ipaNonCombDiacs = "";

  while (diacriticStart.includes(str[i]) && str.slice(i, i+2) != "=\\") {
    xsDiac = str[i++];

      if (xsDiac == "_" && i < str.length) {
        xsDiac += str[i++];

        if (xsDiac == "_<" && baseMap.hasOwnProperty(xsBase + "_<")) {
          // IPA uses separate characters for implosives;
          // X-SAMPA uses the _< diacritic.
          ipaBase = xsBaseToIpaBase(xsBase + "_<");
          xsDiac = "";
        } else if (xsDiac == "_?" && str[i] == "\\") {
          xsDiac += str[i++];
        } else if (xsDiac == "_B" && str.slice(i, i+2) == "_L") {
          xsDiac += "_L";
          i += 2;
        } else if (xsDiac == "_H" && str.slice(i, i+2) == "_T") {
          xsDiac += "_T";
          i += 2;
        } else if (xsDiac == "_R" && str.slice(i, i+2) == "_F") {
          xsDiac += "_F";
          i += 2;
        }
      } else if ((xsDiac == "`") && baseMap.hasOwnProperty(xsBase + "`")) {
        // Special case for retroflex consonants (and some R-colored vowels)
        ipaBase = xsBaseToIpaBase(xsBase + "`");
        xsDiac = "";
      }

      // Combining diacritics should go over the base letter.
      // Therefore, they should go before non-combining diacritics.
      if (combiningDiacs.hasOwnProperty(xsDiac))
        ipaCombDiacs += combiningDiacs[xsDiac];
      else if (nonCombiningDiacs.hasOwnProperty(xsDiac))
        ipaNonCombDiacs += nonCombiningDiacs[xsDiac];
      else
        ipaNonCombDiacs += xsDiac;
  }

  return [ipaBase, ipaCombDiacs + ipaNonCombDiacs, i];
}

function convert(str) {
  var outStr = "",
      i = 0,
      xsBase,
      ipaBase,
      ipaDiacs;

  while (i < str.length) {
    [xsBase, ipaBase, i] = convertBase(str, i);
    [ipaBase, ipaDiacs, i] = convertDiacritics(str, i, xsBase, ipaBase);
    outStr += (ipaBase + ipaDiacs);
  }

  return outStr;
}
