module.exports = [
  {
    id: 'weekly-groceries',
    name: 'Weekly groceries run',
    description:
      'Fresh produce, pantry staples, and household basics for the week.',
    defaultCategory: 'Groceries',
    defaultAmountCents: 18500,
    defaultExpectedDayOffset: 7,
    defaultNotes: 'Includes meal plan ingredients and household staples.',
    tags: ['food', 'household', 'recurring'],
  },
  {
    id: 'household-essentials',
    name: 'Monthly household essentials',
    description: 'Cleaning supplies, toiletries, and home consumables restock.',
    defaultCategory: 'Household',
    defaultAmountCents: 9000,
    defaultExpectedDayOffset: 14,
    defaultNotes: 'Soap, detergent, paper goods, and cleaning supplies.',
    tags: ['home', 'supplies'],
  },
  {
    id: 'kids-activities',
    name: 'Kids activities & lessons',
    description: 'After-school programs, lessons, or weekend activities.',
    defaultCategory: 'Kids Activities',
    defaultAmountCents: 12000,
    defaultExpectedDayOffset: 21,
    defaultNotes:
      'Covers registration fees and supplies for upcoming sessions.',
    tags: ['family', 'education'],
  },
];
