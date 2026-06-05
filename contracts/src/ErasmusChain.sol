// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ErasmusChain {
    struct Document {
        string cid;
        uint256 timestamp;
    }

    mapping(address => Document[]) private studentDocuments;
    uint256 public documentCount;

    event DocumentCertified(address indexed student, string cid, uint256 timestamp);

    function certifyDocument(string memory cid) external returns (uint256) {
        require(bytes(cid).length > 0, "CID non valido");
        
        documentCount++;
        studentDocuments[msg.sender].push(Document({
            cid: cid,
            timestamp: block.timestamp
        }));

        emit DocumentCertified(msg.sender, cid, block.timestamp);

        return documentCount;
    }

    function getMyDocuments(address student) external view returns (Document[] memory) {
        return studentDocuments[student];
    }

    function getStudentDocuments(address student) external view returns (Document[] memory) {
        return studentDocuments[student];
    }

    function verifyDocument(address student, string memory cid) external view returns (bool) {
        Document[] storage docs = studentDocuments[student];
        for (uint256 i = 0; i < docs.length; i++) {
            if (keccak256(abi.encodePacked(docs[i].cid)) == keccak256(abi.encodePacked(cid))) {
                return true;
            }
        }
        return false;
    }

    function getDocumentCountForStudent(address student) external view returns (uint256) {
        return studentDocuments[student].length;
    }
}