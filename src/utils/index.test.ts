import { strToEnum } from './index';

enum TestEnum {
	BOB = 'BOB',
	ALICE = 'ALICE',
	PETER = 'PETER',
}

describe('strToEnum', () => {
	it('should coerce string into enum', () => {
		expect(strToEnum('BOB', TestEnum)).toBe(TestEnum.BOB);
		expect(strToEnum('ALICE', TestEnum)).toBe(TestEnum.ALICE);
		expect(strToEnum('PETER', TestEnum)).toBe(TestEnum.PETER);
	});

	it('should return undefined if not part of enum', () => {
		expect(strToEnum('ALEX', TestEnum)).toBe(undefined);
	});

	it('should return undefined if string is undefined', () => {
		expect(strToEnum(undefined, TestEnum)).toBe(undefined);
	});
});
