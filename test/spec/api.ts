import * as cxml from "../..";
import * as Promise from "bluebird";
var fs = require("fs");
var path = require("path");
import * as gpml from "../xmlns/pathvisio.org/GPML/2013a";
import * as example from "../xmlns/dir-example";

jasmine.DEFAULT_TIMEOUT_INTERVAL = 20 * 1000;

test("Attach handler w/ _before & _after. Parse string", () => {
  // NOTE: this assertion count is NOT taking into account
  // the commented out expect below regarding
  // "dir instanceof example.document.dir.constructor"
  expect.assertions(8);

  var parser = new cxml.Parser();

  var parser = new cxml.Parser();

  parser.attach(
    class DirHandler extends example.document.dir.constructor {
      /** Fires when the opening <dir> and attributes have been parsed. */

      _after() {
        expect(this).toEqual({ name: "empty" });
      }

      _before() {
        expect(this).toEqual({ name: "empty" });
      }
    },
    "/dir"
  );

  const result = parser.parse('<dir name="empty"></dir>', example.document);

  return result.then((doc: example.document) => {
    expect(doc).toEqual({ dir: { name: "empty" } });
    var dir = doc.dir;

    // TODO why doesn't this pass?
    //expect(dir instanceof example.document.dir.constructor).toBe(true);
    expect(dir instanceof example.document.file.constructor).toBe(false);

    expect(dir instanceof example.DirType).toBe(true);
    expect(dir instanceof example.FileType).toBe(false);

    expect(dir._exists).toBe(true);
    expect(dir.file[0]._exists).toBe(false);
  });
});

test("Attach handler w/ _before & _after. Parse stream.", () => {
  expect.assertions(3);

  var parser = new cxml.Parser();

  parser.attach(
    class DirHandler extends example.document.dir.constructor {
      /** Fires when the opening <dir> and attributes have been parsed. */

      _before() {
        expect(this.name).toBe("123");
      }

      _after() {
        expect(this).toEqual({
          name: "123",
          owner: "me",
          file: [{ name: "test", size: 123, content: "data" }]
        });
      }
    },
    "/dir"
  );

  const result = parser.parse(
    fs.createReadStream(path.resolve(__dirname, "../xml/dir-example.xml")),
    example.document
  );

  return result.then((doc: example.document) => {
    expect(doc).toEqual({
      dir: {
        name: "123",
        owner: "me",
        file: [
          {
            name: "test",
            size: 123,
            content: "data"
          }
        ]
      }
    });
  });
});

test("Attach handler w/ _before & _after. Parse both string and stream.", () => {
  expect.assertions(11);

  var parser = new cxml.Parser();

  parser.attach(
    class DirHandler extends example.document.dir.constructor {
      /** Fires when the opening <dir> and attributes have been parsed. */

      _before() {
        expect(typeof this.name).toBe("string");
      }

      /** Fires when the closing </dir> and children have been parsed. */

      _after() {
        expect(typeof this.name).toBe("string");
      }
    },
    "/dir"
  );

  const resultFromString = parser.parse(
    '<dir name="empty"></dir>',
    example.document
  );

  const resultFromStream = parser.parse(
    fs.createReadStream(path.resolve(__dirname, "../xml/dir-example.xml")),
    example.document
  );

  return Promise.all([resultFromString, resultFromStream]).then(function(
    [docFromString, docFromStream]: [example.document, example.document]
  ) {
    expect(docFromString).toEqual({ dir: { name: "empty" } });

    var dirFromString = docFromString.dir;

    // TODO why doesn't this pass?
    //expect(dirFromString instanceof example.document.dir.constructor).toBe(true);
    expect(dirFromString instanceof example.document.file.constructor).toBe(
      false
    );

    expect(dirFromString instanceof example.DirType).toBe(true);
    expect(dirFromString instanceof example.FileType).toBe(false);

    expect(dirFromString._exists).toBe(true);
    expect(dirFromString.file[0]._exists).toBe(false);

    expect(docFromStream).toEqual({
      dir: {
        name: "123",
        owner: "me",
        file: [
          {
            name: "test",
            size: 123,
            content: "data"
          }
        ]
      }
    });
  });
});

////test("attach to and parse broken Pathway from string", () => {
////  expect.assertions(3);
////
////  var parser = new cxml.Parser();
////  parser.attach(
////    class CustomHandler extends gpml.document.Pathway.constructor {
////      _before() {
////        console.log("this _before");
////        console.log(this);
////        expect(typeof this).toBe("object");
////      }
////
////      _after() {
////        console.log("this _after");
////        console.log(this);
////        expect(typeof this).toBe("object");
////      }
////    },
////    "/Pathway"
////  );
////  return parser
////    .parse(
////      '<DataNode Name="sample pathway"><Comment>hello there</Comment></DataNode>',
////      gpml.document
////    )
////    .then(doc => {
////      expect(typeof doc).toBe("object");
////    });
////});

test("Attach handler w/ _before & _after. Parse Comment from string.", () => {
  expect.assertions(3);

  var parser = new cxml.Parser();
  parser.attach(
    class CustomHandler extends gpml.document.Pathway.Comment[0].constructor {
      _before() {
        expect(typeof this).toBe("object");
      }

      _after() {
        expect(typeof this).toBe("object");
      }
    },
    "/Pathway/Comment"
  );
  return parser
    .parse(
      '<Pathway Name="sample pathway"><Comment>hello there</Comment></Pathway>',
      gpml.document
    )
    .then(doc => {
      expect(typeof doc).toBe("object");
    });
});

test("attach to DataNode Comment and parse GPML", () => {
  expect.assertions(6);

  var parser = new cxml.Parser();

  parser.attach(
    class CustomHandler extends gpml.document.Pathway.DataNode[0].Comment[0]
      .constructor {
      _before() {
        expect(this.content).toBe(undefined);
        expect(this.Source).toBe("my-datanode-comment-source");
      }

      _after() {
        expect(this.content).toBe("my-datanode-comment");
        expect(this.Source).toBe("my-datanode-comment-source");
      }
    },
    "/Pathway/DataNode/Comment"
  );

  return parser
    .parse(
      `<Pathway Name="sample pathway">
				<Comment Source="my-pathway-comment-source">my-pathway-comment</Comment>
				<DataNode>
					<Comment Source="my-datanode-comment-source">my-datanode-comment</Comment>
				</DataNode>
			</Pathway>`,
      gpml.document
    )
    .then(doc => {
      const comment = doc.Pathway.DataNode[0].Comment[0];
      expect(comment.content).toBe("my-datanode-comment");
      expect(comment.Source).toBe("my-datanode-comment-source");
    });
});

//[
//  `<gpml:Pathway xmlns:gpml="http://pathvisio.org/GPML/2013a" Name="sample pathway">
//		<gpml:Comment>hello there</gpml:Comment>
//	</gpml:Pathway>`,
//
//  `<Pathway xmlns:x="http://pathvisio.org/GPML/2013a" Name="sample pathway">
//		<Comment>hello there</Comment>
//	</Pathway>`,
//
//  `<Pathway xmlns="http://pathvisio.org/GPML/2013a" Name="sample pathway">
//		<Comment>hello there</Comment>
//	</Pathway>`,
//
//  `<Pathway Name="sample pathway">
//		<Comment>hello there</Comment>
//	</Pathway>`
//]
//  .reduce(function(acc, pathway) {
//    acc.push(pathway);
//    acc.push('<?xml version="1.0" encoding="utf-8"?>\n' + pathway);
//    return acc;
//  }, [])
//  .concat([
//    fs.createReadStream(path.resolve(__dirname, "../input/simple.gpml"))
//  ])
//  .forEach(function(input, i) {
//    test(`attach to and parse simple Pathway from input index ${i}`, () => {
//      expect.assertions(6);
//
//      var parser = new cxml.Parser();
//      parser.attach(
//        class CustomHandler extends gpml.document.Pathway.constructor {
//          _before() {
//            expect(this.Name).toBe("sample pathway");
//            expect(this.Comment[0]._exists).toBe(false);
//          }
//
//          _after() {
//            expect(this.Name).toBe("sample pathway");
//            expect(this.Comment[0].content).toBe("hello there");
//          }
//        },
//        "/Pathway"
//      );
//
//      return parser.parse(input, gpml.document).then(doc => {
//        const pathway = doc.Pathway;
//        expect(pathway.Name).toBe("sample pathway");
//        expect(pathway.Comment[0].content).toBe("hello there");
//      });
//    });
//  });
//
//test("attach to and parse Pathway from stream", () => {
//  expect.assertions(3);
//
//  var parser = new cxml.Parser();
//  parser.attach(
//    class CustomHandler extends gpml.document.Pathway.constructor {
//      _before() {
//        expect(typeof this).toBe("object");
//      }
//
//      _after() {
//        expect(typeof this).toBe("object");
//      }
//    },
//    "/Pathway"
//  );
//
//  return parser
//    .parse(
//      fs.createReadStream(path.resolve(__dirname, "../input/one-of-each.gpml")),
//      gpml.document
//    )
//    .then(doc => {
//      expect(typeof doc).toBe("object");
//    });
//});

////test("attach to Pathway.DataNode[0].Comment[0]", done => {
////  var parser = new cxml.Parser();
////  parser.attach(
////    class CustomHandler extends gpml.document.Pathway.DataNode[0].Comment[0]
////      .constructor {
////      /*
////      _before() {
////        console.log("Before:");
////        console.log(JSON.stringify(this));
////        expect(typeof this).toBe("object");
////      }
////			//*/
////
////      _after() {
////        console.log("After:");
////        console.log(JSON.stringify(this));
////        expect(this.content).toBe("DataNode: anotherComment");
////      }
////    }
////  );
////  var result = parser.parse(
////    fs.createReadStream(path.resolve(__dirname, "../input/one-of-each.gpml")),
////    gpml.document
////  );
////  result.then(doc => {
////    console.log("\n=== 123 ===\n");
////    console.log(JSON.stringify(doc, null, 2));
////    expect(typeof doc).toBe("object");
////    done();
////  });
////});
////
////////***************************
//////var parser1 = new cxml.Parser();
//////var result1 = parser1.parse(
//////  fs.createReadStream(path.resolve(__dirname, "../input/one-of-each.gpml")),
//////  gpml.document
//////);
//////
//////parser1.attach(
//////  class CustomHandler extends gpml.document.Pathway.constructor {
//////    _before() {
//////      console.log("this _before");
//////      console.log(this);
//////    }
//////
//////    _after() {
//////      console.log("this _after");
//////      console.log(this);
//////    }
//////  }
//////);
//////
//////result1.then(doc => {
//////  console.log("\n=== 123 ===\n");
//////  console.log(JSON.stringify(doc, null, 2));
//////});
////////***************************
//////
//////var parser = new cxml.Parser();
//////
//////var result = parser.parse(
//////  fs.createReadStream(path.resolve(__dirname, "../input/one-of-each.gpml")),
//////  gpml.document
//////);
//////
//////test("attach to Pathway", done => {
//////  parser.attach(
//////    class CustomHandler extends gpml.document.Pathway.constructor {
//////      _before() {
//////        console.log("this _before");
//////        console.log(this);
//////      }
//////
//////      _after() {
//////        console.log("this _after");
//////        console.log(this);
//////        done();
//////      }
//////    }
//////  );
//////});
//////
//////parser.attach(
//////  class CustomHandler extends gpml.document.Pathway.Comment[0].constructor {
//////    _before() {
//////      //expect(typeof this).toBe("object");
//////    }
//////
//////    _after() {
//////      console.log("this");
//////      console.log(this);
//////      /*
//////			if (iAfter < 1) {
//////				expect(this.content).toBe("Document: mycommentA");
//////				done();
//////			}
//////			iAfter += 1;
//////			//*/
//////    }
//////  }
//////);
//////
////////test("attach to Pathway.Comment[0]", done => {
////////  let iAfter = 0;
////////  expect.assertions(1);
////////  parser.attach(
////////    class CustomHandler extends gpml.document.Pathway.Comment[0]
////////      .constructor {
////////      _before() {
////////        //expect(typeof this).toBe("object");
////////      }
////////
////////      _after() {
////////        console.log("this");
////////        console.log(this);
////////        expect(this.content).toBe("Document: mycommentA");
////////        done();
////////        /*
////////        if (iAfter < 1) {
////////          expect(this.content).toBe("Document: mycommentA");
////////          done();
////////        }
////////        iAfter += 1;
////////				//*/
////////      }
////////    }
////////  );
////////});
//////
////////test("attach to Pathway.DataNode[0].Comment[0]", done => {
////////  let called = false;
////////  parser.attach(
////////    class CustomHandler extends gpml.document.Pathway.DataNode[0].Comment[0]
////////      .constructor {
////////      /*
////////      _before() {
////////        console.log("Before:");
////////        console.log(JSON.stringify(this));
////////        expect(typeof this).toBe("object");
////////      }
////////			//*/
////////
////////      _after() {
////////        console.log("After:");
////////        console.log(JSON.stringify(this));
////////        if (!called) {
////////          called = true;
////////          expect(this.content).toBe("DataNode: anotherComment");
////////          done();
////////        }
////////      }
////////    }
////////  );
////////});
//////
//////test("full response", () => {
//////  expect.assertions(1);
//////  return result.then(doc => {
//////    //console.log("\n=== 123 ===\n");
//////    //console.log(JSON.stringify(doc, null, 2));
//////    expect(typeof doc).toBe("object");
//////  });
//////});
//////
///////*
//////console.log("gpml.document.Pathway.Comment[0].constructor.toString()");
//////console.log(gpml.document.Pathway.Comment[0].constructor.toString());
//////console.log(gpml.document.Pathway.Comment[0].constructor);
//////console.log(gpml.document.Pathway.Comment[0]);
//////
//////console.log(
//////  "gpml.document.Pathway.DataNode[0].Comment[0].constructor.toString()"
//////);
//////console.log(
//////  gpml.document.Pathway.DataNode[0].Comment[0].constructor.toString()
//////);
//////console.log(gpml.document.Pathway.DataNode[0].Comment[0].constructor);
//////console.log(gpml.document.Pathway.Comment[0]);
////////*/