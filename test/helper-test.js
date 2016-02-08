/* eslint-env mocha */

import expect from 'expect';
import Helper from '../lib/utils/helper.js';

describe('Helper', () => {
  describe('splitTextBySentence', () => {
    it('should return the same text if below the limit', () => {
      // Given
      let input = 'Foo bar. Lorem Ipsum.';

      // When
      let actual = Helper.splitTextBySentence(input, 100);

      // Then
      expect(actual).toEqual([input]);
    });
    it('should not cut a sentence in half', () => {
      // Given
      let input = 'Foo bar. Lorem Ipsum.';

      // When
      let actual = Helper.splitTextBySentence(input, 5);

      // Then
      expect(actual[0]).toEqual('Foo bar.');
      expect(actual[1]).toEqual('Lorem Ipsum.');
    });
    it('should not get confuses by several dots if sentence is small enough', () => {
      // Given
      let input = '(Being a reprint from the reminiscences of JOHN H. WATSON, M.D., late of the Army Medical Department.)';

      // When
      let actual = Helper.splitTextBySentence(input);

      // Then
      expect(actual).toEqual([input]);
      //
    });
  });
});
