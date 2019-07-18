dojo.provide("ibm_atom.widget.FeedEntryViewer");

dojo.require("dojo.fx");
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dijit._Container");
dojo.require("dijit.layout.ContentPane");
dojo.require("ibm_atom.io.atom");
dojo.requireLocalization("ibm_atom.widget", "FeedEntryViewer");

(function(){
	//Function to test and emit if this package is effectively deprecated at this dojo level
	//As it was contributed to dojo 1.3 and later.
	try{
		var v = dojo.version.toString();
		if(v){
			v = v.substring(0,3);
			v = parseFloat(v);
			if (v > 1.2) {
				dojo.deprecated("ibm_atom.widget.FeedEntryViewer", "Use dojox.atom.widget.FeedEntryViewer instead.");
			}
		}
	}catch(e){}
})();

/*
	(C) COPYRIGHT International Business Machines Corp., 2006
	All Rights Reserved * Licensed Materials - Property of IBM
*/

dojo.declare(
	"ibm_atom.widget.FeedEntryViewer",
	[dijit._Widget, dijit._Templated, dijit._Container],
	{
	// summary:  An ATOM feed entry editor for publishing updated ATOM entries, or viewing non-editable entries.
	// description:  An ATOM feed entry editor for publishing updated ATOM entries, or viewing non-editable entries.

	entrySelectionTopic: "",	   //The topic to listen on for entries to edit.

	_validEntryFields: {},		//The entry fields that were present on the entry and are being displayed.  
								  //This works in conjuntion with what is selected to be displayed.
	displayEntrySections: "",	 //What current sections of the entries to display as a comma separated list.
	_displayEntrySections: null,
	
	//Control options for the display options menu.
	enableMenu: false,
	enableMenuFade: false,
	_optionButtonDisplayed: true,

	//Templates for the HTML rendering.  Need to figure these out better, admittedly.
	templatePath: dojo.moduleUrl("ibm_atom", "widget/templates/FeedEntryViewer.html"),
	
	_entry: null,			//The entry that is being viewed/edited.
	_feed:  null,			//The feed the entry came from.

	_editMode: false,		//Flag denoting the state of the widget, in edit mode or not.
	
	postCreate: function() {
		if (this.entrySelectionTopic !== "")
			this._subscriptions = [dojo.subscribe(this.entrySelectionTopic, this, "_handleEvent")];

		var _nlsResources = dojo.i18n.getLocalization("ibm_atom.widget", "FeedEntryViewer");
		this.displayOptions.innerHTML = _nlsResources.displayOptions;
		this.feedEntryCheckBoxLabelTitle.innerHTML = _nlsResources.title;
		this.feedEntryCheckBoxLabelAuthors.innerHTML = _nlsResources.authors;
		this.feedEntryCheckBoxLabelContributors.innerHTML = _nlsResources.contributors;
		this.feedEntryCheckBoxLabelId.innerHTML = _nlsResources.id;
		this.close.innerHTML = _nlsResources.close;
		this.feedEntryCheckBoxLabelUpdated.innerHTML = _nlsResources.updated;
		this.feedEntryCheckBoxLabelSummary.innerHTML = _nlsResources.summary;
		this.feedEntryCheckBoxLabelContent.innerHTML = _nlsResources.content;
		
	},

	startup: function() {
		
		if (this.displayEntrySections === "")
			this._displayEntrySections = ["title","authors","contributors","summary","content","id","updated"];
		else
			this._displayEntrySections = this.displayEntrySections.split(",");
		this._setDisplaySectionsCheckboxes();

		if (this.enableMenu) {
			dojo.style(this.feedEntryViewerMenu, 'display', '');
			if (this.entryCheckBoxRow && this.entryCheckBoxRow2) {
				if (this.enableMenuFade) {
					dojo.fadeOut({node: this.entryCheckBoxRow,duration: 250}).play();
					dojo.fadeOut({node: this.entryCheckBoxRow2,duration: 250}).play();
				}
			}
		}
	},

	clear: function() {
		// summary:  Function to clear the state of the widget.
		// description:  Function to clear the state of the widget.

		this.destroyDescendants();
		this._entry=null;
		this._feed=null;
		
		this.clearNodes();
	},
	
	clearNodes: function() {
		dojo.style(this.entryTitleRow, 'display', 'none');
		dojo.style(this.entryAuthorRow, 'display', 'none');
		dojo.style(this.entryContributorRow, 'display', 'none');
		dojo.style(this.entrySummaryRow, 'display', 'none');
		dojo.style(this.entryContentRow, 'display', 'none');
		dojo.style(this.entryIdRow, 'display', 'none');
		dojo.style(this.entryUpdatedRow, 'display', 'none');

		while (this.entryTitleNode.firstChild) {
			dojo._destroyElement(this.entryTitleNode.firstChild);
		}
		
		while (this.entryTitleHeader.firstChild) {
			dojo._destroyElement(this.entryTitleHeader.firstChild);
		}

		while (this.entryAuthorNode.firstChild) {
			dojo._destroyElement(this.entryAuthorNode.firstChild);
		}
		
		while (this.entryAuthorHeader.firstChild) {
			dojo._destroyElement(this.entryAuthorHeader.firstChild);
		}

		while (this.entryContributorHeader.firstChild) {
			dojo._destroyElement(this.entryContributorHeader.firstChild);
		}

		while (this.entryContributorNode.firstChild) {
			dojo._destroyElement(this.entryContributorNode.firstChild);
		}

		while (this.entrySummaryHeader.firstChild) {
			dojo._destroyElement(this.entrySummaryHeader.firstChild);
		}

		while (this.entrySummaryNode.firstChild) {
			dojo._destroyElement(this.entrySummaryNode.firstChild);
		}

		while (this.entryContentHeader.firstChild) {
			dojo._destroyElement(this.entryContentHeader.firstChild);
		}

		while (this.entryContentNode.firstChild) {
			dojo._destroyElement(this.entryContentNode.firstChild);
		}

		while (this.entryIdNode.firstChild) {
			dojo._destroyElement(this.entryIdNode.firstChild);
		}

		while (this.entryIdHeader.firstChild) {
			dojo._destroyElement(this.entryIdHeader.firstChild);
		}

		while (this.entryUpdatedHeader.firstChild) {
			dojo._destroyElement(this.entryUpdatedHeader.firstChild);
		}

		while (this.entryUpdatedNode.firstChild) {
			dojo._destroyElement(this.entryUpdatedNode.firstChild);
		}
	},

	setEntry: function(entry, feed, leaveMenuState) {
		// summary:  Function to set the current entry that is being edited.
		// description:  Function to set the current entry that is being edited.
		//
		// entry: object
		//	Instance of ibm.io.atom.Entry to display for reading/editing.

		this.clear();
		this._validEntryFields = {};
		this._entry = entry;
		this._feed = feed;

		if (entry !== null) {
			 // Handle the title.
			if (this.entryTitleHeader) {
				this.setTitleHeader(this.entryTitleHeader, entry);
			}
			
			if (this.entryTitleNode) {
				this.setTitle(this.entryTitleNode, this._editMode, entry);
			}

			if (this.entryAuthorHeader) {
				this.setAuthorsHeader(this.entryAuthorHeader, entry);
			}

			if (this.entryAuthorNode) {
				this.setAuthors(this.entryAuthorNode, this._editMode, entry);
			}
			
			if (this.entryContributorHeader) {
				 this.setContributorsHeader(this.entryContributorHeader, entry);
			}

			if (this.entryContributorNode) {
				 this.setContributors(this.entryContributorNode, this._editMode, entry);
			}

			if (this.entryIdHeader) {
				 this.setIdHeader(this.entryIdHeader, entry);
			}

			if (this.entryIdNode) {
				 this.setId(this.entryIdNode, this._editMode, entry);
			}

			if (this.entryUpdatedHeader) {
			   this.setUpdatedHeader(this.entryUpdatedHeader, entry); 
			}

			if (this.entryUpdatedNode) {
			   this.setUpdated(this.entryUpdatedNode, this._editMode, entry); 
			}

			if (this.entrySummaryHeader) {
			   this.setSummaryHeader(this.entrySummaryHeader, entry); 
			}

			if (this.entrySummaryNode) {
			   this.setSummary(this.entrySummaryNode, this._editMode, entry); 
			}

			if (this.entryContentHeader) {
			   this.setContentHeader(this.entryContentHeader, entry); 
			}

			if (this.entryContentNode) {
			   this.setContent(this.entryContentNode, this._editMode, entry); 
			}
		}
		this._displaySections();
	},

	setTitleHeader: function(titleHeaderNode, entry) {
		// summary:  Function to set the contents of the title header node in the template to some value.
		// description: Function to set the contents of the title header node in the template to some value.
		//   This exists specifically so users can over-ride how the title data is filled out from an entry.
		//
		// titleAchorNode: DOM node.
		//   The DOM node to attach the title data to.
		// editMode: boolean 
		//   Boolean to indicate if the display should be in edit mode or not.
		// entry: object
		//   The Feed Entry to work with.
		//
		
		if (entry.title && entry.title.value && entry.title.value !== null ) {
			var _nlsResources = dojo.i18n.getLocalization("ibm_atom.widget", "FeedEntryViewer");
			var titleHeader = new ibm_atom.widget.EntryHeader({title: _nlsResources.title});
			titleHeaderNode.appendChild(titleHeader.domNode);
		}
	},

	setTitle: function(titleAnchorNode, editMode, entry) {
		// summary:  Function to set the contents of the title node in the template to some value from the entry.
		// description: Function to set the contents of the title node in the template to some value from the entry.
		//   This exists specifically so users can over-ride how the title data is filled out from an entry.
		//
		// titleAchorNode: DOM node.
		//   The DOM node to attach the title data to.
		// editMode: boolean 
		//   Boolean to indicate if the display should be in edit mode or not.
		// entry: object
		//   The Feed Entry to work with.
		//

		if (entry.title && entry.title.value && entry.title.value !== null ) {
			if(entry.title.type == "text"){
				var titleNode = document.createTextNode(entry.title.value);
				titleAnchorNode.appendChild(titleNode);
			} else {
				var titleViewNode = document.createElement("span");
				var titleView = new dijit.layout.ContentPane({refreshOnShow: true, executeScripts: false}, titleViewNode);
				titleView.setContent(entry.title.value);
				titleAnchorNode.appendChild(titleView.domNode);
			}
			this.setFieldValidity("title", true);
		}
	},

	setAuthorsHeader: function(authorHeaderNode, entry) {
		// summary:  Function to set the title format for the authors section of the author row in the template to some value from the entry.
		// description: Function to set the title format for the authors section of the author row in the template to some value from the entry.
		//   This exists specifically so users can over-ride how the author data is filled out from an entry.
		//
		// authorHeaderNode: DOM node.
		//   The DOM node to attach the author section header data to.
		// editMode: boolean 
		//   Boolean to indicate if the display should be in edit mode or not.
		// entry: object
		//   The Feed Entry to work with.

		if (entry.authors && entry.authors.length > 0 ) {
			var _nlsResources = dojo.i18n.getLocalization("ibm_atom.widget", "FeedEntryViewer");
			var authorHeader = new ibm_atom.widget.EntryHeader({title: _nlsResources.authors});
			authorHeaderNode.appendChild(authorHeader.domNode);
		}
	},

	setAuthors: function(authorsAnchorNode, editMode, entry) {
		// summary:  Function to set the contents of the author node in the template to some value from the entry.
		// description: Function to set the contents of the author node in the template to some value from the entry.
		//   This exists specifically so users can over-ride how the title data is filled out from an entry.
		//
		// authorsAchorNode: DOM node.
		//   The DOM node to attach the author data to.
		// editMode: boolean 
		//   Boolean to indicate if the display should be in edit mode or not.
		// entry: object
		//   The Feed Entry to work with.

		if (entry.authors && entry.authors.length > 0 ) {
			for (i in entry.authors) {
			   if (entry.authors[i].name) {
			   		var anchor = authorsAnchorNode;
			   		if(entry.authors[i].uri) {
						var link = document.createElement("a");
						anchor.appendChild(link);
						link.href = entry.authors[i].uri;
						anchor = link;
					}
					var name = entry.authors[i].name;
					if(entry.authors[i].email){
						name = name + " (" + entry.authors[i].email + ")";
					}
					var authorNode = document.createTextNode(name);
					anchor.appendChild(authorNode);
					var breakNode = document.createElement("br");
					authorsAnchorNode.appendChild(breakNode);
					this.setFieldValidity("authors", true);
				}
			}
		}
	},

	setContributorsHeader: function(contributorsHeaderNode, entry) {
		// summary:  Function to set the contents of the contributor node in the template to some value from the entry.
		// description: Function to set the contents of the contributor node in the template to some value from the entry.
		//   This exists specifically so users can over-ride how the title data is filled out from an entry.
		//
		// contributorsHeaderNode: DOM node.
		//   The DOM node to attach the contributor title to.
		// editMode: boolean 
		//   Boolean to indicate if the display should be in edit mode or not.
		// entry: object
		//   The Feed Entry to work with.

		if (entry.contributors && entry.contributors.length > 0 ) {
			var _nlsResources = dojo.i18n.getLocalization("ibm_atom.widget", "FeedEntryViewer");
			var contributorHeader = new ibm_atom.widget.EntryHeader({title: _nlsResources.contributors});
			contributorHeaderNode.appendChild(contributorHeader.domNode);
		}
	},


	setContributors: function(contributorsAnchorNode, editMode, entry) {
		// summary:  Function to set the contents of the contributor node in the template to some value from the entry.
		// description: Function to set the contents of the contributor node in the template to some value from the entry.
		//   This exists specifically so users can over-ride how the title data is filled out from an entry.
		//
		// contributorsAnchorNode: DOM node.
		//   The DOM node to attach the contributor data to.
		// editMode: boolean 
		//   Boolean to indicate if the display should be in edit mode or not.
		// entry: object
		//   The Feed Entry to work with.

		if (entry.contributors && entry.contributors.length > 0 ) {
			for (i in entry.contributors) {
				var contributorNode = document.createTextNode(entry.contributors[i].name);
				contributorsAnchorNode.appendChild(contributorNode);
				breakNode = document.createElement("br");
				contributorsAnchorNode.appendChild(breakNode);
				this.setFieldValidity("contributors", true);
			}
		}
	},

				 
	setIdHeader: function(idHeaderNode, entry) {
		// summary:  Function to set the contents of the ID  node in the template to some value from the entry.
		// description: Function to set the contents of the ID node in the template to some value from the entry.
		//   This exists specifically so users can over-ride how the title data is filled out from an entry.
		//
		// idAnchorNode: DOM node.
		//   The DOM node to attach the ID data to.
		// editMode: boolean 
		//   Boolean to indicate if the display should be in edit mode or not.
		// entry: object
		//   The Feed Entry to work with.

		if (entry.id && entry.id !== null ) {
			var _nlsResources = dojo.i18n.getLocalization("ibm_atom.widget", "FeedEntryViewer");
			var idHeader = new ibm_atom.widget.EntryHeader({title: _nlsResources.id});
			idHeaderNode.appendChild(idHeader.domNode);
		}
	},


	setId: function(idAnchorNode, editMode, entry) {
		// summary:  Function to set the contents of the ID  node in the template to some value from the entry.
		// description: Function to set the contents of the ID node in the template to some value from the entry.
		//   This exists specifically so users can over-ride how the title data is filled out from an entry.
		//
		// idAnchorNode: DOM node.
		//   The DOM node to attach the ID data to.
		// editMode: boolean 
		//   Boolean to indicate if the display should be in edit mode or not.
		// entry: object
		//   The Feed Entry to work with.

		if (entry.id && entry.id !== null ) {
			var idNode = document.createTextNode(entry.id);
			idAnchorNode.appendChild(idNode);
			this.setFieldValidity("id", true);
		}
	},
	
	setUpdatedHeader: function(updatedHeaderNode, entry) {
		// summary:  Function to set the contents of the updated  node in the template to some value from the entry.
		// description: Function to set the contents of the updated node in the template to some value from the entry.
		//   This exists specifically so users can over-ride how the title data is filled out from an entry.
		//
		// updatedAnchorNode: DOM node.
		//   The DOM node to attach the udpated data to.
		// editMode: boolean 
		//   Boolean to indicate if the display should be in edit mode or not.
		// entry: object
		//   The Feed Entry to work with.

		if (entry.updated && entry.updated !== null ) {
			var _nlsResources = dojo.i18n.getLocalization("ibm_atom.widget", "FeedEntryViewer");
			var updatedHeader = new ibm_atom.widget.EntryHeader({title: _nlsResources.updated});
			updatedHeaderNode.appendChild(updatedHeader.domNode);
		}
	},

	setUpdated: function(updatedAnchorNode, editMode, entry) {
		// summary:  Function to set the contents of the updated  node in the template to some value from the entry.
		// description: Function to set the contents of the updated node in the template to some value from the entry.
		//   This exists specifically so users can over-ride how the title data is filled out from an entry.
		//
		// updatedAnchorNode: DOM node.
		//   The DOM node to attach the udpated data to.
		// editMode: boolean 
		//   Boolean to indicate if the display should be in edit mode or not.
		// entry: object
		//   The Feed Entry to work with.

		if (entry.updated && entry.updated !== null ) {
			var updatedNode = document.createTextNode(entry.updated);
			updatedAnchorNode.appendChild(updatedNode);
			this.setFieldValidity("updated", true);
		}
	},

	setSummaryHeader: function(summaryHeaderNode, entry) {
		 // summary:  Function to set the contents of the summary  node in the template to some value from the entry.
		 // description: Function to set the contents of the summary node in the template to some value from the entry.
		 //   This exists specifically so users can over-ride how the title data is filled out from an entry.
		 //
		 // summaryHeaderNode: DOM node.
		 //   The DOM node to attach the summary title to.
		 // editMode: boolean 
		 //   Boolean to indicate if the display should be in edit mode or not.
		 // entry: object
		 //   The Feed Entry to work with.


		if (entry.summary && entry.summary.value && entry.summary.value !== null ) {
			var _nlsResources = dojo.i18n.getLocalization("ibm_atom.widget", "FeedEntryViewer");
			var summaryHeader = new ibm_atom.widget.EntryHeader({title: _nlsResources.summary});
			summaryHeaderNode.appendChild(summaryHeader.domNode);
		}
	},


	setSummary: function(summaryAnchorNode, editMode, entry) {
		// summary:  Function to set the contents of the summary  node in the template to some value from the entry.
		// description: Function to set the contents of the summary node in the template to some value from the entry.
		//   This exists specifically so users can over-ride how the title data is filled out from an entry.
		//
		// summaryAnchorNode: DOM node.
		//   The DOM node to attach the summary data to.
		// editMode: boolean 
		//   Boolean to indicate if the display should be in edit mode or not.
		// entry: object
		//   The Feed Entry to work with.

		if (entry.summary && entry.summary.value && entry.summary.value !== null ) {
			var summaryViewNode = document.createElement("span");
			var summaryView = new dijit.layout.ContentPane({refreshOnShow: true, executeScripts: false}, summaryViewNode);
			summaryView.setContent(entry.summary.value);
			summaryAnchorNode.appendChild(summaryView.domNode);
			this.setFieldValidity("summary", true);
		}
	},

	setContentHeader: function(contentHeaderNode, entry) {
		// summary:  Function to set the contents of the content node in the template to some value from the entry.
		// description: Function to set the contents of the content node in the template to some value from the entry.
		//   This exists specifically so users can over-ride how the title data is filled out from an entry.
		//
		// summaryAnchorNode: DOM node.
		//   The DOM node to attach the content data to.
		// editMode: boolean 
		//   Boolean to indicate if the display should be in edit mode or not.
		// entry: object
		//   The Feed Entry to work with.

		if (entry.content && entry.content.value && entry.content.value !== null ) {
			var _nlsResources = dojo.i18n.getLocalization("ibm_atom.widget", "FeedEntryViewer");
			var contentHeader = new ibm_atom.widget.EntryHeader({title: _nlsResources.content});
			contentHeaderNode.appendChild(contentHeader.domNode);
		}
	},


	setContent: function(contentAnchorNode, editMode, entry) {
		// summary:  Function to set the contents of the content node in the template to some value from the entry.
		// description: Function to set the contents of the content node in the template to some value from the entry.
		//   This exists specifically so users can over-ride how the title data is filled out from an entry.
		//
		// summaryAnchorNode: DOM node.
		//   The DOM node to attach the content data to.
		// editMode: boolean 
		//   Boolean to indicate if the display should be in edit mode or not.
		// entry: object
		//   The Feed Entry to work with.
		if (entry.content && entry.content.value && entry.content.value !== null ) {
			var contentViewNode = document.createElement("span");
			var contentView = new dijit.layout.ContentPane({refreshOnShow: true, executeScripts: false},contentViewNode);
			contentView.setContent(entry.content.value);
			contentAnchorNode.appendChild(contentView.domNode);
			this.setFieldValidity("content", true);
		}
	},


	_displaySections: function() {
		// summary: Internal function for determining which sections of the view to actually display.
		// description: Internal function for determining which sections of the view to actually display.
		//
		// returns:  Nothing. 

		
		dojo.style(this.entryTitleRow, 'display', 'none');
		dojo.style(this.entryAuthorRow, 'display', 'none');
		dojo.style(this.entryContributorRow, 'display', 'none');
		dojo.style(this.entrySummaryRow, 'display', 'none');
		dojo.style(this.entryContentRow, 'display', 'none');
		dojo.style(this.entryIdRow, 'display', 'none');
		dojo.style(this.entryUpdatedRow, 'display', 'none');

		for (i in this._displayEntrySections) {
			var section = this._displayEntrySections[i].toLowerCase();
			if (section === "title" && this.isFieldValid("title")) {
				dojo.style(this.entryTitleRow, 'display', '');
			}
			if (section === "authors" && this.isFieldValid("authors")) {
				dojo.style(this.entryAuthorRow, 'display', '');
			}
			if (section === "contributors" && this.isFieldValid("contributors")) {
				dojo.style(this.entryContributorRow, 'display', '');
			}
			if (section === "summary" && this.isFieldValid("summary")) {
				dojo.style(this.entrySummaryRow, 'display', '');
			}
			if (section === "content" && this.isFieldValid("content")) {
				dojo.style(this.entryContentRow, 'display', '');
			}
			if (section === "id" && this.isFieldValid("id")) {
				dojo.style(this.entryIdRow, 'display', '');
			}
			if (section === "updated" && this.isFieldValid("updated")) {
				dojo.style(this.entryUpdatedRow, 'display', '');
			}

		}
	},

	setDisplaySections: function(sectionsArray) {
		// summary: Function for setting which sections of the entry should be displayed.
		// description: Function for setting which sections of the entry should be displayed.
		//
		// sectionsArray: array
		//   Array of string names that indicate which sections to display.
		//
		// returns:  Nothing.
		if (sectionsArray !== null) {
			this._displayEntrySections = sectionsArray;
			this._displaySections();
		}
		else {
			this._displayEntrySections = ["title","authors","contributors","summary","content","id","updated"];
		}
	},

	_setDisplaySectionsCheckboxes: function() {
		// summary: Internal function for setting which checkboxes on the display are selected.
		// description: Internal function for setting which checkboxes on the display are selected.
		//
		// returns:  Nothing.

		var items = ["title","authors","contributors","summary","content","id","updated"];
		for(i in items) {
			if(dojo.indexOf(this._displayEntrySections, items[i])==-1)
				dojo.style(this["feedEntryCell"+items[i]], 'display', 'none');
			else
				this["feedEntryCheckBox"+items[i].substring(0,1).toUpperCase()+items[i].substring(1)].checked=true;
		}
	},

	_readDisplaySections: function() {
		// summary: Internal function for reading what is currently checked for display and generating the display list from it.
		// description: Internal function for reading what is currently checked for display and generating the display list from it.
		//
		// returns:  Nothing.

		var checkedList = [];

		if (this.feedEntryCheckBoxTitle.checked) {
			checkedList.push("title");
		}
		if (this.feedEntryCheckBoxAuthors.checked) {
			checkedList.push("authors");
		}
		if (this.feedEntryCheckBoxContributors.checked) {
			checkedList.push("contributors");
		}
		if (this.feedEntryCheckBoxSummary.checked) {
			checkedList.push("summary");
		}
		if (this.feedEntryCheckBoxContent.checked) {
			checkedList.push("content");
		}
		if (this.feedEntryCheckBoxId.checked) {
			checkedList.push("id");
		}
		if (this.feedEntryCheckBoxUpdated.checked) {
			checkedList.push("updated");
		}
		this._displayEntrySections = checkedList;
	},

	_toggleCheckbox: function(checkBox) {
		 // summary: Internal function for determining of a particular entry is editable.
		 // description: Internal function for determining of a particular entry is editable.
		 //   This is used for determining if the delete action should be displayed or not.
		 //
		 // checkBox: object
		 //   The checkbox object to toggle the selection on.
		 //
		 // returns:  Nothing
		if (checkBox.checked) {
			checkBox.checked=false;
		}
		else {
			checkBox.checked=true;
		}
		this._readDisplaySections();
		this._displaySections();
	},

	_toggleOptions: function(checkBox) {
		 // summary: Internal function for determining of a particular entry is editable.
		 // description: Internal function for determining of a particular entry is editable.
		 //   This is used for determining if the delete action should be displayed or not.
		 //
		 // checkBox: object
		 //   The checkbox object to toggle the selection on.
		 //
		 // returns:  Nothing

		if (this.enableMenu) {
			var fade = null;
			if (this._optionButtonDisplayed) {

				if (this.enableMenuFade) {
					var anim = dojo.fadeOut({node: this.entryCheckBoxDisplayOptions,duration: 250});
					dojo.connect(anim, "onEnd", this, function(){
						dojo.style(this.entryCheckBoxDisplayOptions, 'display', 'none');
						dojo.style(this.entryCheckBoxRow, 'display', '');
						dojo.style(this.entryCheckBoxRow2, 'display', '');
						dojo.fadeIn({node: this.entryCheckBoxRow, duration: 250}).play();
						dojo.fadeIn({node: this.entryCheckBoxRow2, duration: 250}).play();
					});
					anim.play();
				}
				else {
					dojo.style(this.entryCheckBoxDisplayOptions, 'display', 'none');
					dojo.style(this.entryCheckBoxRow, 'display', '');
					dojo.style(this.entryCheckBoxRow2, 'display', '');
				}
				this._optionButtonDisplayed=false;
			}
			else {
				if (this.enableMenuFade) {
					var anim = dojo.fadeOut({node: this.entryCheckBoxRow,duration: 250});
					var anim2 = dojo.fadeOut({node: this.entryCheckBoxRow2,duration: 250});
					dojo.connect(anim, "onEnd", this, function(){
						dojo.style(this.entryCheckBoxRow, 'display', 'none');
						dojo.style(this.entryCheckBoxRow2, 'display', 'none');
						dojo.style(this.entryCheckBoxDisplayOptions, 'display', '');
						dojo.fadeIn({node: this.entryCheckBoxDisplayOptions, duration: 250}).play();
					});
					anim.play();
					anim2.play();
				} 
				else {
					dojo.style(this.entryCheckBoxRow, 'display', 'none');
					dojo.style(this.entryCheckBoxRow2, 'display', 'none');
					dojo.style(this.entryCheckBoxDisplayOptions, 'display', '');
				}
				this._optionButtonDisplayed=true;
			}
		}
	},

	_handleEvent: function(entrySelectionEvent) {
		// summary: Internal function for listening to a topic that will handle entry notification.
		// description: Internal function for listening to a topic that will handle entry notification.
		//
		// entrySelectionEvent: object
		//   The topic message containing the entry that was selected for view.
		//
		// returns:  Nothing.
		if(entrySelectionEvent.source != this) {
			if(entrySelectionEvent.action == "set" && entrySelectionEvent.entry)
				this.setEntry(entrySelectionEvent.entry, entrySelectionEvent.feed);
			else if(entrySelectionEvent.action == "delete" && entrySelectionEvent.entry && entrySelectionEvent.entry == this._entry)
				this.clear();
		}
	},

	setFieldValidity: function(field, isValid) {
		// summary: Function to set whether a field in the view is valid and displayable.
		// description: Function to set whether a field in the view is valid and displayable.
		//   This is needed for over-riding of the set* functions and customization of how data is displayed in the attach point.
		//   So if custom implementations use their own display logic, they can still enable the field.
		//
		// field: String
		//   The field name to set the valid parameter on.  Such as 'content', 'id', etc.
		// isValid: boolean
		//   Flag denoting if the field is valid or not.
		//
		// returns:  Nothing.

		if (field) {
			var lowerField = field.toLowerCase();
			this._validEntryFields[field] = isValid;
		}
	},
	
	isFieldValid: function(field) {
		// summary: Function to return if a displayable field is valid or not
		// description: Function to return if a displayable field is valid or not
		//
		// field: String
		//   The field name to get the valid parameter of.  Such as 'content', 'id', etc.
		//
		// returns:  boolean denoting if the field is valid and set.
		
		return this._validEntryFields[field.toLowerCase()];
	},

	getEntry: function() {
		return this._entry;
	},

	getFeed: function() {
		 return this._feed;
	},

	destroy: function() {
		this.clear();
		dojo.forEach(this._subscriptions, dojo.unsubscribe);
	}
});

dojo.declare(
	"ibm_atom.widget.EntryHeader",
	[dijit._Widget, dijit._Templated, dijit._Container],
	{
	// summary: Widget representing a header in a FeedEntryViewer/Editor
	// description: Widget representing a header in a FeedEntryViewer/Editor
        
    title: "",
    templatePath: dojo.moduleUrl("ibm_atom", "widget/templates/EntryHeader.html"),
    
    postCreate: function() {
		this.setListHeader();
    },
    
    setListHeader: function(title) {
        this.clear();
        if (title) {
            this.title = title;
        }
        var textNode = document.createTextNode(this.title);
        this.entryHeaderNode.appendChild(textNode);
    },

    clear: function() {
		this.destroyDescendants();
         if (this.entryHeaderNode) {
             for (var i = 0; i < this.entryHeaderNode.childNodes.length; i++) {
                 this.entryHeaderNode.removeChild(this.entryHeaderNode.childNodes[i]);
             }
         }
    },

    destroy: function() {
        this.clear();
    }
});