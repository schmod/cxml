// This file is part of cxml, copyright (c) 2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import {Namespace, ModuleExports, ImportSpec} from '../xml/Namespace';
import {MemberSpec} from '../xml/Member';
import {TypeSpec} from '../xml/Type';

import {Context} from '../xml/Context';
import {Parser} from '../xml/Parser';

/** Tuple: flags, parent type ID, child element list, attribute list */
export type RawTypeSpec = [ number, number, MemberSpec[], MemberSpec[] ];

export var defaultContext = new Context();

/** List of pending namespaces (not yet registered or waiting for processing). */
var pendingNamespaceList: ModuleExports[] = [];
/** Grows with pendingNamespaceList and shrinks when namespaces are registered.
  * When zero, all pending namespaces have been registered and can be processed. */
var pendingNamespaceCount = 0;
var pendingTypeList: TypeSpec[] = [];

var namespaceList: Namespace[] = [];
var typeList: TypeSpec[] = [];

/** Mark a namespace as seen and add it to list of pending namespaces. */

function mark(exports: ModuleExports, namespace?: Namespace) {
	if(!exports._cxml) {
		exports._cxml = [null];
		pendingNamespaceList.push(exports);
		++pendingNamespaceCount;
	}

	if(namespace) exports._cxml[0] = namespace;
}

/** Process namespaces seen so far. */

function process(pendingNamespaceList: ModuleExports[], pendingTypeList: TypeSpec[]) {
	// Link types to their parents.

	for(var exportObject of pendingNamespaceList) {
		var namespace = exportObject._cxml[0];
		namespace.link();
	}

	// Create classes for all types.
	// This is effectively Kahn's algorithm for topological sort
	// (the rest is in the TypeSpec class).

	for(var typeSpec of pendingTypeList) {
		if(!typeSpec.parent || typeSpec.parent == typeSpec) {
			typeSpec.defineType();
		}
	}

	for(var typeSpec of pendingTypeList) {
		typeSpec.defineMembers();
	}

	for(var exportObject of pendingNamespaceList) {
		var namespace = exportObject._cxml[0];

		namespace.exportTypes(exportObject);
		namespace.exportDocument(exportObject);
	}
}

/** Register a namespace.
  * This is called by JavaScript autogenerated by the cxsd compiler. */

export function register(
	name: string,
	exportObject: ModuleExports,
	importSpecList: ImportSpec[],
	exportTypeNameList: string[],
	rawTypeSpecList: RawTypeSpec[]
) {
	var typeSpecList: TypeSpec[] = [];
	var exportTypeCount = exportTypeNameList.length;
	var typeCount = rawTypeSpecList.length;
	var typeName: string;

	var namespace = defaultContext.registerNamespace(name).init(importSpecList);
	namespaceList.push(namespace);

	for(var typeNum = 0; typeNum < typeCount; ++typeNum) {
		var rawSpec = rawTypeSpecList[typeNum];

		if(typeNum > 0 && typeNum <= exportTypeCount) {
			typeName = exportTypeNameList[typeNum - 1];
		} else typeName = null;

		var typeSpec = new TypeSpec(namespace, typeName, rawSpec[0], rawSpec[1], rawSpec[2], rawSpec[3]);

		namespace.addType(typeSpec);
		pendingTypeList.push(typeSpec);
		typeList.push(typeSpec);
	}

	mark(exportObject, namespace);

	for(var spec of importSpecList) mark(spec[0]);
	if(--pendingNamespaceCount == 0) {
		process(pendingNamespaceList, pendingTypeList);

		pendingNamespaceList = [];
		pendingTypeList = [];
	}
}

/** Remove temporary structures needed to define new handlers and initialize the parser. */

export function init(strict?: boolean) {
	for(var namespace of namespaceList) {
		namespace.importSpecList = null;
		namespace.exportTypeNameList = null;
		namespace.typeSpecList = null;
		namespace.exportTypeTbl = null;
	}

	for(var typeSpec of typeList) {
		typeSpec.cleanPlaceholders(strict);
	}

	namespaceList = null;
	typeList = null;
}
