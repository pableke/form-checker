
//funciones para la validacion y saneado de valores numericos
function NumberFormat() {
	var _self = this; //auto-reference
	this.masks = {
		"default": { decimals: 2, whole: 3, section: ",", decimal: "." },
		"float":   { decimals: 2, whole: 3, section: ",", decimal: "." },
		"latin":   { decimals: 2, whole: 3, section: ".", decimal: "," },
		"integer": { decimals: 0, whole: 3, section: " ", decimal: "." },
		"binary":  { decimals: 0, whole: 4, section: "-", base: 2 },
		"hex":     { decimals: 0, whole: 2, section: ".", base: 16 }
	};

	function lpad(val, len) {
		for (len = len || 2; val.length < len; )
			val = "0" + val;
		return val;
	};

	function chunk(str, size) {
		var parts = Math.ceil(str.length / size);
		return lpad(str, parts * size);
	};

	/**
	 * _format(n, x, s, c, b)
	 *
	 * @param integer v: value to format
	 * @param integer n: length of decimal part (default 0)
	 * @param integer x: length of whole part (default 3)
	 * @param mixed   s: sections delimiter (default ,)
	 * @param mixed   c: decimal delimiter (default .)
	 * @param integer b: number base format (default base 10)
	*/
	var _format = function(v, n, x, s, c, b) {
		v = v || 0;
		x = x || 3;
		n = b ? 0 : ~~n;
		var num = b ? chunk((~~v).toString(b), x) : v.toFixed(Math.max(0, n));
		var re = new RegExp("\\d(?=(\\d{" + x + "})+" + (n > 0 ? "\\D" : "$") + ")", "g");
		return (c ? num.replace(".", c) : num).replace(re, "$&" + (s || ","));
	};

	/**
	 * _number(v, s, c)
	 *
	 * @param string  v: value to format
	 * @param mixed   s: sections delimiter
	 * @param mixed   c: decimal delimiter
	 * @param integer b: number base format (default base 10)
	 */
	var _number = function(v, s, c, b) {
		if (typeof v != "string")
			return v;
		var reWholePart = new RegExp("[\\s" + s + "]+", "g");
		var num = (b && (b != 10))
					? parseInt(v.replace(reWholePart, "").replace(c, ""), b)
					: parseFloat(v.replace(reWholePart, "").replace(c, "."));
		return isNaN(num) ? parseFloat(v) : num;
	};

	/**
	 * toNumber(value, mask)
	 *
	 * @param string value: input to convert
	 * @param string  mask: input value format
	 */
	this.toNumber = function(value, mask) {
		var opts = _self.masks[mask] || mask || _self.masks["default"];
		return _number(value, opts.section, opts.decimal, opts.base);
	};

	/**
	 * format(value, mask)
	 *
	 * @param integer value: value to format
	 * @param string  mask: format to apply
	 */
	this.format = function(value, mask) {
		if (isNaN(+value))
			return value; // return as it is.
		var opts = _self.masks[mask] || mask || _self.masks["default"];
		return _format(value, opts.decimals, opts.whole,
						opts.section, opts.decimal,
						opts.base);
	};
};
/***************************** FIN BLOQUE *****************************/

/**************************** NUEVO BLOQUE ****************************/
//funciones para la validacion y saneado de valores de fechas
function DateFormat() {
	var _self = this; //auto-reference module
	var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZWN]|'[^']*'|'[^']*'/g;
	var timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;
	var timezoneClip = /[^-+\dA-Z]/g;

	this.masks = {
		'default':               'ddd mmm dd yyyy HH:MM:ss',
		'shortDate':             'yy/m/d',
		'mediumDate':            'mmm d, yyyy',
		'longDate':              'mmmm d, yyyy',
		'fullDate':              'dddd, mmmm d, yyyy',
		'shortTime':             'h:MM TT',
		'mediumTime':            'h:MM:ss TT',
		'longTime':              'h:MM:ss TT Z',
		'isoDate':               'yyyy-mm-dd',
		'latinDate':             'dd/mm/yyyy',
		'isoTime':               'HH:MM:ss',
		'isoDateTime':           'yyyy-mm-dd\'T\'HH:MM:sso',
		'latinDateTime':         'dd/mm/yyyy\'T\'HH:MM:sso',
		'isoUtcDateTime':        'UTC:yyyy-mm-dd\'T\'HH:MM:ss\'Z\'',
		'dateTime':              'yyyy-mm-dd HH:MM:ss',
		'expiresHeaderFormat':   'ddd, dd mmm yyyy HH:MM:ss Z'
	};

	// Internationalization strings
	this.i18n = {
		dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
		dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
		monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
	};

	/**
	 * Determine if the date param is a valid date object
	 *
	 * @param {Object} `date`
	 */
	this.isValid = function(date) {
		return (date instanceof Date) && date.getTime && !isNaN(date.getTime());
	};

	/**
	 * Transform the date string input into a valid date object, mask indicates the date format
	 *
	 * @param string date: date string format representation
	 * @param string mask: define the date string format
	 */
	this.toDate = function(date, mask) {
		if (!date) return null;
		var flags = {}; //parts container
		mask = _self.masks[mask] || mask || _self.masks['default'];
		var values = date.trim().match(/[a-zA-Z]+|\d+/g);
		mask.match(token).forEach(function(v, i) { flags[v] = values[i]; });

		//sanitize input params for the Date constructor
		var d = flags.d || flags.dd || 1; //dia base 1
		var m = flags.m || flags.mm;
		if (m) m--; //mes base 0
		else {
			m = _self.i18n.monthNamesShort.indexOf(flags.mmm);
			if (m < 0)
				m = Math.max(_self.i18n.monthNames.indexOf(flags.mmmm), 0);
		}
		var y = flags.yyyy || (new Date()).getFullYear().toString().substr(0, 2) + flags.yy;
		var H = flags.H || flags.HH || ((flags.h || flags.hh) % 12) || 12;
		var M = flags.M || flags.MM || 0;
		var s = flags.s || flags.ss || 0;
		var oDate = new Date(+y, m, d, +H, +M, +s);
		return _self.isValid(oDate) ? oDate : null;
	};

	function lpad(val, len) {
		for (len = len || 2; val.length < len; )
			val = "0" + val;
		return val;
	};

	/**
	 * format(value, mask)
	 *
	 * @param date   date: date to format
	 * @param string mask: format to apply
	 * @param string utc:  universal datetime indicator
	 * @param string gtm:  internet greenwich mean indicator
	 */
	this.format = function(date, mask, utc, gmt) {
		// You can provide only mask, then date is now
		if (arguments.length === 1 && (typeof date == 'string')) {
			mask = date;
			date = new Date();
		}

		if (!_self.isValid(date))
			return date; //invalid date

		mask = _self.masks[mask] || mask || _self.masks['default'];

		// Allow setting the utc/gmt argument via the mask
		var maskSlice = mask.slice(0, 4);
		if (maskSlice === 'UTC:' || maskSlice === 'GMT:') {
			gmt = (maskSlice === 'GMT:');
			mask = mask.slice(4);
			utc = true;
		}

		var _ = utc ? 'getUTC' : 'get';
		var d = date[_ + 'Date']();
		var D = date[_ + 'Day']();
		var m = date[_ + 'Month']();
		var y = date[_ + 'FullYear']();
		var H = date[_ + 'Hours']();
		var M = date[_ + 'Minutes']();
		var s = date[_ + 'Seconds']();
		var L = date[_ + 'Milliseconds']();
		var o = utc ? 0 : date.getTimezoneOffset();
		var W = getWeek(date);
		var N = getDayOfWeek(date);
		var flags = {
			d:    d,
			dd:   lpad(d),
			ddd:  _self.i18n.dayNamesShort[D],
			dddd: _self.i18n.dayNames[D],
			m:    m + 1,
			mm:   lpad(m + 1),
			mmm:  _self.i18n.monthNamesShort[m],
			mmmm: _self.i18n.monthNames[m],
			yy:   String(y).slice(2),
			yyyy: y,
			h:    H % 12 || 12,
			hh:   lpad(H % 12 || 12),
			H:    H,
			HH:   lpad(H),
			M:    M,
			MM:   lpad(M),
			s:    s,
			ss:   lpad(s),
			l:    lpad(L, 3),
			L:    lpad(Math.round(L / 10)),
			t:    H < 12 ? 'a'  : 'p',
			tt:   H < 12 ? 'am' : 'pm',
			T:    H < 12 ? 'A'  : 'P',
			TT:   H < 12 ? 'AM' : 'PM',
			Z:    gmt ? 'GMT' : utc ? 'UTC' : (String(date).match(timezone) || ['']).pop().replace(timezoneClip, ''),
			o:    (o > 0 ? '-' : '+') + lpad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
			S:    ['th', 'st', 'nd', 'rd'][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10],
			W:    W,
			N:    N
		};

		return mask.replace(token, function(match) {
			return (match in flags) ? flags[match]
									: match.slice(1, match.length - 1);
		});
	};

	/**
	 * Get the ISO 8601 week number
	 * Based on comments from
	 * http://techblog.procurios.nl/k/n618/news/view/33796/14863/Calculate-ISO-8601-week-and-year-in-javascript.html
	 *
	 * @param  {Object} `date`
	 * @return {Number}
	 */
	function getWeek(date) {
		// Remove time components of date
		var targetThursday = new Date(date.getFullYear(), date.getMonth(), date.getDate());

		// Change date to Thursday same week
		targetThursday.setDate(targetThursday.getDate() - ((targetThursday.getDay() + 6) % 7) + 3);

		// Take January 4th as it is always in week 1 (see ISO 8601)
		var firstThursday = new Date(targetThursday.getFullYear(), 0, 4);

		// Change date to Thursday same week
		firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3);

		// Check if daylight-saving-time-switch occured and correct for it
		var ds = targetThursday.getTimezoneOffset() - firstThursday.getTimezoneOffset();
		targetThursday.setHours(targetThursday.getHours() - ds);

		// Number of weeks between target Thursday and first Thursday
		var weekDiff = (targetThursday - firstThursday) / (86400000*7);
		return 1 + Math.floor(weekDiff);
	};

	/**
	 * Get ISO-8601 numeric representation of the day of the week
	 * 1 (for Monday) through 7 (for Sunday)
	 *
	 * @param  {Object} `date`
	 * @return {Number}
	 */
	function getDayOfWeek(date) {
		var dow = date.getDay();
		return (dow === 0) ? 7 : dow;
	};
};

//funcion factoria de validadores
function FormChecker(form, i18n) {
	//internacionalization object
	i18n = i18n || {
		"msg.err.value": "Invalid data",
		"msg.err.form": "Form contains errors"
	};

	var nf = new NumberFormat();
	var df = new DateFormat();

	var _val = function(elem, name) { return $(elem).val() || ""; };
	var _attr = function(elem, name) { return elem && elem.getAttribute(name); };
	var _fAttr = function(elem, name) { return parseFloat(_attr(elem, name)); };
	var _fVal = function(elem, name) { return parseFloat(_val(elem, name)); };
	var _boolval = function(val) { return val && (val != "false") && (val != "0"); };
	var _bool = function(elem, name) { return _boolval(_val(elem, name)); };

	var _tooltip = function(elem, attr) {
		var pos = { my: "left center", at: "right+12 center" };
		var msg = _attr(elem, "data-msg-" + attr) || i18n["msg.err." + attr] || i18n["msg.err.value"];
		var box = (_attr(elem, "type") == "hidden") ? $(elem).siblings("[alt=errbox]") : $(elem);
		box.tooltip({position: pos, content: msg, tooltipClass: "arrow", items: "[alt]"}).tooltip("open");
		return elem;
	};

	var _validators = { //metodos de validacion
		required: function(elem, attr) {
			return _bool(elem) ? _val(elem) : true;
		},

		minlength: function(elem, attr) {
			return !_val(elem) || (_fAttr(elem, attr) <= _val(elem).length);
		},

		maxlength: function(elem, attr) {
			return !_val(elem) || (_fAttr(elem, attr) >= _val(elem).length);
		},

		email: function(elem, attr) {
			return !_bool(attr) || !_val(elem) || /\w+[^\s@]+@[^\s@]+\.[^\s@]+/.test(_val(elem));
		},

		regex: function(elem, attr) {
			return !_val(elem) || (new RegExp(_attr(elem, attr))).test(_val(elem));
		},

		digits: function(elem) {
			return !_bool(attr) || !_val(elem) || /\d+/.test(_val(elem));
		},

		number: function(elem, attr) { //attr = mask number format
			return !_val(elem) || !isNaN(nf.toNumber(_val(elem), _attr(elem, attr)));
		},

		min: function(elem, attr) {
			var value = nf.toNumber(_val(elem), _attr(elem, "number"));
			return !_val(elem) || (!isNaN(value) && (_fAttr(elem, attr) <= value));
		},

		max: function(elem, attr) {
			var value = nf.toNumber(_val(elem), _attr(elem, "number"));
			return !_val(elem) || (!isNaN(value) && (_fAttr(elem, attr) >= value));
		},

		range: function(elem, attr) {
			if (!_val(elem)) return true;
			try {
				var range = JSON.parse(_attr(elem, attr));
			} catch(e) {
				return false;
			}
			return (_fVal(elem) >= parseFloat(range[0])) && (_fVal(elem) <= parseFloat(range[1]));
		},

		date: function(elem, attr) {
			return !_val(elem) || df.isValid(df.toDate(_val(elem), _attr(elem, attr)));
		},

		mindate: function(elem, attr) {
			var min = new Date(_attr(elem, attr));
			return !_val(elem) || (df.isValid(min) && _validators.date(elem, "date")
								&& (min <= df.toDate(_val(elem), _attr(elem, "date"))));
		},

		maxdate: function(elem, attr) {
			var max = new Date(_attr(elem, attr));
			return !_val(elem) || (df.isValid(max) && _validators.date(elem, "date")
								&& (max >= df.toDate(_val(elem), _attr(elem, "date"))));
		},

		equalto: function(elem, attr) {
			return !_val(elem) || (_val(elem) == $(_attr(elem, attr), form).val());
		}
	};

	this.get = function(name) { return _validators[name]; };
	this.set = function(name, fn) {
		_validators[name] = fn;
		return this;
	};

	this.loadErrors = function(errors) {
		for (var k in errors)
			_tooltip($("[name=" + k + "]:input", form), errors[k]);
		return this;
	};

	this.flush = function() {
		$("[alt]:input", form).each(function() {
			$(this).tooltip({ content: "", items: "[alt]" }).tooltip("close");
		});
		return this;
	};

	this.check = function() {
		var ok = true;
		for (var k in _validators) {
			$("[" + k + "]:input", form).each(function() {
				var fn = _validators[k];
				ok = fn(this, k) ? ok : !_tooltip(this, k);
			});
		}
		return ok;
	};
};
