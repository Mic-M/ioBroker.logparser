Falls einer dieser Satzteile/Begriffe in einer Logzeile enthalten ist, dann wird der Log-Eintrag von diesem Adapter ignoriert, auch unabhängig davon, was in den Parser-Regeln (Filter) eingestellt ist. Es ist sowohl String als auch Regex erlaubt. Falls String: es wird auf teilweise Übereinstimmung geprüft, d.h. wenn du z.B. „echo“ einträgst, dann wird jede Logzeile, die „echo“ enthält, ausgefiltert, also auch z.B. „Command sent to echo in kitchen.“

Regex bitte zwischen `/` und `/` setzen, damit erkennt der Adapter, ob es sich um eine Regexp handelt.

In der Spalte "Kommentar" kannst du beliebig den jeweiligen Eintrag kommentieren/erklären, etwa damit du später nachvollziehen kannst, warum du diesen Blacklist-Eintrag gesetzt hast.