
//funciones para la validacion y saneado de valores numericos
function NumberFormat() {
	var self = this; //auto-reference
	const binMask = /[^01]+/g;
	const intMask = /[^0-9e\-]+/gi;
	const hexMask = /[^0-9a-f]/gi;
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
		var num = (b && (b != 10)) ? chunk((v >>> 0).toString(b), x) : v.toFixed(Math.max(0, n));
		var re = new RegExp("[0-9a-f](?=([0-9a-f]{" + x + "})+" + (n > 0 ? "\\D" : "$") + ")", "gi");
		return (c ? num.replace(".", c) : num).replace(re, "$&" + (s || ","));
	};

	/**
	 * toNumber(value, mask)
	 *
	 * @param string value: input to convert
	 * @param string/object mask: input value format
	 */
	this.toNumber = function(value, mask) {
		if (typeof value != "string") return value;
		var opts = masks[mask] || mask || masks.default;
		if (opts.base == 2)
			return parseInt(value.replace(binMask, ""), 2) >> 0; // to int32
		if (opts.base == 16)
			return parseInt(value.replace(hexMask, ""), 16) >> 0; // to int32
		var i = value.lastIndexOf(opts.decimal);
		var num = value.replace(intMask, "");
		if (i < 0) return parseFloat(num);
		i = num.length - (value.length - i) + 1;
		return parseFloat(num.substr(0, i) + "." + num.substr(i));
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

	/**
	 * trNumber(value, mask, dest)
	 *
	 * @param string value: value to format
	 * @param string/object mask: format to apply
	 * @param string/object dest: destination mask
	 */
	this.trNumber = function(value, mask, dest) {
		return self.format(self.toNumber(value, mask), dest || mask);
	};
};
/***************************** FIN BLOQUE *****************************/

/**************************** NUEVO BLOQUE ****************************/
//funciones para la validacion y saneado de valores de fechas
function DateFormat(i18n) {
	var self = this; //auto-reference
	const reMaskTokens = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZWN]|'[^']*'/g;
	const reDateTokens = /\d{1,4}|[a-z]+/gi; //split date string parts
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
		isoUtcDateTime:      "yyyy-mm-dd HH:MM:ss Z",
		dateTime:            "yyyy-mm-dd HH:MM:ss",
		expiresHeaderFormat: "ddd, dd mmm yyyy HH:MM:ss Z"
	};

	i18n = i18n || {};
	i18n.dayNamesShort = i18n.dayNamesShort || ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	i18n.dayNames = i18n.dayNames || ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	i18n.monthNamesShort = i18n.monthNamesShort || ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	i18n.monthNames = i18n.monthNames || ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

	function lpad(val) { return (val < 10) ? ("0" + val) : val; }; //alwais 2 digits
	function digit(coll, val) { return coll.indexOf(val) + 1; }; //-1 = false, int = 0

	var now = new Date();
	var Y = now.getFullYear().toString(); //this year string
	var tzo = now.getTimezoneOffset(); //local time zone offset
	var o = (Math.floor(Math.abs(tzo) / 60) * 100 + Math.abs(tzo) % 60).toString();
	var O = ((tzo < 0) ? "-" : "+") + "0000".substring(o.length) + o;

	this.trDate = function(date, mask, dest) {
		mask = masks[mask] || mask || masks.default;
		dest = masks[dest] || dest || masks.default;

		var parts = date.match(reDateTokens); //get date parts
		var flags = mask.match(reMaskTokens).reduce(function(r, t, i) {
			r[t] = parts[i];
			return r;
		}, {});

		//inicialize flags data object
		flags.yy = flags.yy || (flags.yyyy ? flags.yyyy.substr(2, 2) : Y.substr(2, 2));
		flags.yyyy = flags.yyyy || (Y.substr(0, 2) + flags.yy);
		flags.m = +flags.m || parseInt(flags.mm) || digit(i18n.monthNamesShort, flags.mmm)
												|| digit(i18n.monthNames, flags.mmmm) || 1;
		flags.mm = flags.mm || lpad(flags.m);
		flags.mmm = flags.mmm || i18n.monthNamesShort[flags.m - 1];
		flags.mmmm = flags.mmmm || i18n.monthNames[flags.m - 1];
		flags.d = +flags.d || parseInt(flags.dd) || digit(i18n.dayNamesShort, flags.ddd)
												|| digit(i18n.dayNames, flags.dddd) || 1;
		flags.dd = flags.dd || lpad(flags.d);
		var D = (new Date(flags.yyyy, flags.m, flags.d)).getDay();
		flags.ddd = flags.ddd || i18n.dayNamesShort[D];
		flags.dddd = flags.dddd || i18n.dayNames[D];
		flags.h = flags.h || flags.hh;
		flags.H = flags.H || flags.HH || flags.h || 0;
		flags.HH = flags.HH || lpad(flags.H);
		flags.h = flags.h || (flags.H % 12) || 12;
		flags.hh = flags.hh || lpad(flags.h);
		flags.M = flags.M || 0;
		flags.MM = flags.MM || lpad(flags.M);
		flags.s = flags.s || "0";
		flags.ss = flags.ss || lpad(flags.s);
		flags.t = flags.t || ((+flags.H < 12) ? "a" : "p");
		flags.tt = flags.tt || flags.t + "m";
		flags.T = flags.T || flags.t.toUpperCase();
		flags.TT = flags.TT || flags.T + "M";
		flags.Z = flags.Z || "";
		flags.o = flags.o ? (((date.lastIndexOf("+") > 6) ? "+" : "-") + flags.o) : O;
		return dest.replace(reMaskTokens, function(match) { return flags[match]; });
	};

	this.toDate = function(date, mask) {
		mask = masks[mask] || mask || masks.default;
		return new Date(self.trDate(date, mask, "isoDateTime"));
	};

	this.isDate = function(date) {
		return (date instanceof Date) && date.getTime && !isNaN(date.getTime());
	};

	this.format = function(date, mask) {
		mask = masks[mask] || mask || masks.default;
		return self.trDate(date.toString(), "default", mask);
	};
};

//funcion factoria de validadores
function FormChecker(form, i18n) {
	i18n = i18n || {}; //internacionalization object
	i18n["msg.err.value"] = i18n["msg.err.value"] || "Invalid data";
	i18n["msg.err.form"] = i18n["msg.err.form"] || "Form contains errors";

	var nf = new NumberFormat();
	var df = new DateFormat(i18n);

	var _fVal = function(elem, name) { return parseFloat($(elem).val()); };
	var _fAttr = function(elem, name) { return parseFloat($(elem).attr(name)); };
	var _boolval = function(val) { return val && (val != "false") && (val != "0"); };
	var _bool = function(elem, name) { return _boolval($(elem).attr(name)); };

	var _tooltip = function(elem, attr) {
		var msg = $(elem).attr("data-msg-" + attr) || i18n["msg.err." + attr] || i18n["msg.err.value"];
		var box = ($(elem).attr("type") == "hidden") ? $(elem).siblings("[alt=errbox]") : $(elem);
		box.next("span.tooltip").length || box.after('<span class="tooltip">' + msg + '</span>').show();
		return elem;
	};

	var validators = { //metodos de validacion
		required: function(elem, elemval, attr) {
			return _boolval(elemval) ? elemval : true;
		},

		minlength: function(elem, elemval, attr) {
			return !elemval || (_fAttr(elem, attr) <= elemval.length);
		},

		maxlength: function(elem, elemval, attr) {
			return !elemval || (_fAttr(elem, attr) >= elemval.length);
		},

		email: function(elem, elemval, attr) {
			return !_bool(elem, attr) || !elemval || /\w+[^\s@]+@[^\s@]+\.[^\s@]+/.test(elemval);
		},

		regex: function(elem, elemval, attr, attrval) {
			return !elemval || (new RegExp(attrval)).test(elemval);
		},

		digits: function(elem, elemval, attr, attrval) {
			return !_bool(elem, attr) || !elemval || /\d+/.test(elemval);
		},

		number: function(elem, elemval, attr, attrval) { //attr = mask number format
			return !elemval || !isNaN(nf.toNumber(elemval, attrval));
		},

		min: function(elem, elemval, attr, attrval) {
			var value = nf.toNumber(elemval, $(elem).attr("number"));
			return !elemval || (!isNaN(value) && (_fAttr(elem, attr) <= value));
		},

		max: function(elem, elemval, attr, attrval) {
			var value = nf.toNumber(elemval, $(elem).attr("number"));
			return !elemval || (!isNaN(value) && (_fAttr(elem, attr) >= value));
		},

		range: function(elem, elemval, attr, attrval) {
			if (!elemval) return true;
			try {
				var range = JSON.parse(attrval);
			} catch(e) {
				return false;
			}
			return (_fVal(elem) >= parseFloat(range[0])) && (_fVal(elem) <= parseFloat(range[1]));
		},

		date: function(elem, elemval, attr, attrval) {
			return !elemval || df.isDate(df.toDate(elemval, attrval));
		},

		mindate: function(elem, elemval, attr, attrval) {
			var min = new Date(attrval);
			return !elemval || (df.isDate(min) && validators.date(elem, "date")
							&& (min <= df.toDate(elemval, $(elem).attr("date"))));
		},

		maxdate: function(elem, elemval, attr, attrval) {
			var max = new Date(attrval);
			return !elemval || (df.isDate(max) && validators.date(elem, "date")
							&& (max >= df.toDate(elemval, $(elem).attr("date"))));
		},

		equalto: function(elem, elemval, attr, attrval) {
			return !elemval || (elemval == $(attrval, form).val());
		}
	};

	this.get = function(name) { return validators[name]; };
	this.set = function(name, fn) {
		validators[name] = fn;
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
		for (var k in validators) {
			var fn = validators[k];
			$("[" + k + "]:input", form).each(function(i, e) {
				ok = fn(e, $(e).val(), k, $(e).attr(k)) ? ok : !_tooltip(e, k);
			});
		}
		return ok;
	};
};
