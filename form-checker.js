
//funciones para la validacion y saneado de valores numericos
function NumberFormat() {
	const masks = {
		default: { decimals: 2, whole: 3, section: ",", decimal: "." },
		float:   { decimals: 2, whole: 3, section: ",", decimal: "." },
		latin:   { decimals: 2, whole: 3, section: ".", decimal: "," },
		integer: { decimals: 0, whole: 3, section: " ", decimal: "." },
		binary:  { decimals: 0, whole: 4, section: "-", base: 2 },
		hex:     { decimals: 0, whole: 2, section: ".", base: 16 }
	};

	function lpad(val, len) {
		while (val.length < len)
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
	 * @param integer x: length of whole part
	 * @param integer n: length of decimal part
	 * @param mixed   s: sections delimiter (default ,)
	 * @param mixed   c: decimal delimiter (default .)
	 * @param integer b: number base format (default base 10)
	*/
	var _format = function(v, x, n, s, c, b) {
		var num = b ? chunk((~~v).toString(b), x) : v.toFixed(Math.max(0, n));
		var re = new RegExp("[0-9a-f](?=([0-9a-f]{" + x + "})+" + (n > 0 ? "\\D" : "$") + ")", "gi");
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
		if (typeof v != "string") return v;
		var reWholePart = new RegExp("[\\s" + s + "]+", "g");
		var num = (b && (b != 10)) ? parseInt(v.replace(reWholePart, "").replace(c, ""), b)
									: parseFloat(v.replace(reWholePart, "").replace(c, "."));
		return isNaN(num) ? parseFloat(v) : num;
	};

	/**
	 * toNumber(value, mask)
	 *
	 * @param string value: input to convert
	 * @param string/object mask: input value format
	 */
	this.toNumber = function(value, mask) {
		var opts = masks[mask] || mask || masks.default;
		return _number(value, opts.section, opts.decimal, opts.base);
	};

	/**
	 * format(value, mask)
	 *
	 * @param integer value: value to format
	 * @param string/object mask: format to apply
	 */
	this.format = function(value, mask) {
		if (isNaN(+value)) return value; // return as it is.
		var opts = masks[mask] || mask || masks.default;
		return _format(value, opts.whole || 3, opts.decimals || 0, 
						opts.section, opts.decimal, opts.base);
	};
};
/***************************** FIN BLOQUE *****************************/

/**************************** NUEVO BLOQUE ****************************/
//funciones para la validacion y saneado de valores de fechas
function DateFormat(i18n) {
	var self = this; //auto-reference
	const tokens = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZWN]|'[^']*'/g;
	const masks = { //masks container
		default:             "ddd mmm dd yyyy HH:MM:ss",
		shortDate:           "yy/m/d",
		mediumDate:          "mmm d, yyyy",
		longDate:            "mmmm d, yyyy",
		fullDate:            "dddd, mmmm d, yyyy",
		shortTime:           "h:MM TT",
		mediumTime:          "h:MM:ss TT",
		longTime:            "h:MM:ss TT Z",
		isoDate:             "yyyy-mm-dd",
		latinDate:           "dd/mm/yyyy",
		isoTime:             "HH:MM:ss",
		isoDateTime:         "yyyy-mm-dd HH:MM:ss",
		latinDateTime:       "dd/mm/yyyy HH:MM:ss",
		isoUtcDateTime:      "UTC:yyyy-mm-dd HH:MM:ssZ",
		dateTime:            "yyyy-mm-dd HH:MM:ss",
		expiresHeaderFormat: "ddd, dd mmm yyyy HH:MM:ss Z"
	};

	i18n = i18n || {}; //Internationalization object
	i18n.dayNamesShort = i18n.dayNamesShort || ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	i18n.dayNames = i18n.dayNames || ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	i18n.monthNamesShort = i18n.monthNamesShort || ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	i18n.monthNames = i18n.monthNames || ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

	var now = new Date();
	var Y = now.getFullYear();

	function _lpad(val) { return (val < 10) ? ("0" + val) : val; };
	function _digit(coll, val) { return coll.indexOf(val) + 1; };

	this.trDate = function(date, mask, dest) {
		mask = masks[mask] || mask || masks.default;
		dest = masks[dest] || dest || masks.default;

		var parts = date.match(/\d{1,4}|[a-z]+/gi); //get date parts
		var flags = mask.match(tokens).reduce(function(r, t, i) {
			r[t] = parts[i];
			return r;
		}, {});

		//inicialize flags data object
		var i = date.lastIndexOf("-");
		var o = ((i > 10) && (i > (date.length - 8))) ? "-" : "+";
		flags.d = +flags.d || parseInt(flags.dd) || _digit(i18n.dayNamesShort, flags.ddd)
												|| _digit(i18n.dayNames, flags.dddd) || 1;
		flags.dd = flags.dd || _lpad(flags.d);
		flags.ddd = flags.ddd || i18n.dayNamesShort[flags.d - 1];
		flags.dddd = flags.dddd || i18n.dayNames[flags.d - 1];
		flags.m = +flags.m || parseInt(flags.mm) || _digit(i18n.monthNamesShort, flags.mmm)
												|| _digit(i18n.monthNames, flags.mmmm) || 1;
		flags.mm = flags.mm || _lpad(flags.m);
		flags.mmm = flags.mmm || i18n.monthNamesShort[flags.m - 1];
		flags.mmmm = flags.mmmm || i18n.monthNames[flags.m - 1];
		flags.yy = flags.yy || (flags.yyyy ? flags.yyyy.substr(2, 2) : Y.substr(2, 2));
		flags.yyyy = flags.yyyy || (Y.substr(0, 2) + flags.yy);
		flags.h = flags.h || "0";
		flags.hh = flags.hh || _lpad(flags.h);
		flags.H = flags.H || "0";
		flags.HH = flags.HH || _lpad(flags.H);
		flags.M = flags.M || "0";
		flags.MM = flags.MM || _lpad(flags.M);
		flags.s = flags.s || "0";
		flags.ss = flags.ss || _lpad(flags.s);
		flags.t = flags.t || ((+flags.H < 12) ? "a" : "p");
		flags.tt = flags.tt || flags.t + "m";
		flags.T = flags.T || flags.t.toUpperCase();
		flags.TT = flags.TT || flags.T + "M";
		flags.Z = flags.Z || "";
		flags.o = flags.o || "0000";
		flags.o = o + flags.o;
		//traslate date format from source mask to date output mask
		return dest.replace(tokens, function(match) { return flags[match]; });
	};

	this.toDate = function(date, mask) {
		mask = masks[mask] || mask || masks.default;
		return new Date(self.trDate(date, mask, "isoDateTime"));
	};

	this.isDate = function(date) {
		return (date instanceof Date) && date.getTime && !isNaN(date.getTime());
	};
};

//funcion factoria de validadores
function FormChecker(form, i18n) {
	i18n = i18n || {}; //internacionalization object
	i18n["msg.err.value"] = i18n["msg.err.value"] || "Invalid data";
	i18n["msg.err.form"] = i18n["msg.err.form"] || "Form contains errors";

	var nf = new NumberFormat();
	var df = new DateFormat(i18n);

	var _val = function(elem, name) { return $(elem).val() || ""; };
	var _attr = function(elem, name) { return elem && elem.getAttribute(name); };
	var _fAttr = function(elem, name) { return parseFloat(_attr(elem, name)); };
	var _fVal = function(elem, name) { return parseFloat(_val(elem, name)); };
	var _boolval = function(val) { return val && (val != "false") && (val != "0"); };
	var _bool = function(elem, name) { return _boolval(_val(elem, name)); };

	var _tooltip = function(elem, attr) {
		var msg = _attr(elem, "data-msg-" + attr) || i18n["msg.err." + attr] || i18n["msg.err.value"];
		var box = (_attr(elem, "type") == "hidden") ? $(elem).siblings("[alt=errbox]") : $(elem);
		box.next("span.tooltip").length || box.after('<span class="tooltip">' + msg + '</span>').show();
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
			return !_val(elem) || df.isDate(df.toDate(_val(elem), _attr(elem, attr)));
		},

		mindate: function(elem, attr) {
			var min = new Date(_attr(elem, attr));
			return !_val(elem) || (df.isDate(min) && _validators.date(elem, "date")
								&& (min <= df.toDate(_val(elem), _attr(elem, "date"))));
		},

		maxdate: function(elem, attr) {
			var max = new Date(_attr(elem, attr));
			return !_val(elem) || (df.isDate(max) && _validators.date(elem, "date")
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

	this.errors = function(errors) {
		if (errors) {
			for (var k in errors)
				$("[name=" + k + "]:input", form).each(function() { _tooltip(this, errors[k]); });
		}
		return this;
	};

	this.flush = function() {
		$("span.tooltip", form).remove();
		return this;
	};

	this.check = function() {
		this.flush();
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
