/** Operating manual content for the camper guide tab. */

export interface GuideSection {
  heading: string;
  body: string;
  warning?: string;
}

export interface GuideTopic {
  id: string;
  title: string;
  icon: string;
  summary: string;
  sections: GuideSection[];
}

export const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: 'water',
    title: 'Water system',
    icon: '🚿',
    summary: 'Filling fresh water, using the pump, draining grey water.',
    sections: [
      {
        heading: 'Fresh water',
        body:
          'The fresh tank filler is behind the small round hatch marked with a tap symbol. Fill only with drinking water using the food-grade hose from the garage locker. The tank level shows on the control panel above the door.',
      },
      {
        heading: 'Water pump',
        body:
          'Switch the pump on at the control panel before opening any tap. Turn it off while driving and whenever you leave the camper — a pump running dry or a tap knocked open can flood the interior.',
      },
      {
        heading: 'Grey water',
        body:
          'Sink and shower water collects in the grey tank underneath. Empty it only at campsite service points — look for the "chemical WC / grey water" sign. The drain valve lever is under the vehicle behind the rear wheel on the driver side.',
        warning: 'Never drain grey water in nature or in street drains. Fines apply and it ruins the spot for everyone.',
      },
      {
        heading: 'Frost',
        body:
          'Below zero temperatures: keep the heating on and pour a cup of water after emptying the tanks so valves do not freeze shut. In deep winter ask us for the winterisation kit at pickup.',
      },
    ],
  },
  {
    id: 'electric',
    title: 'Electricity',
    icon: '🔌',
    summary: 'Leisure battery, solar, 230V hookup, what you can run.',
    sections: [
      {
        heading: 'Two batteries',
        body:
          'The starter battery drives the engine; the leisure battery runs the living area. Driving and the solar panel charge both. The control panel shows leisure battery voltage — recharge by driving or hookup when it drops under 12.0V.',
      },
      {
        heading: '230V campsite hookup',
        body:
          'Use the orange CEE cable from the garage. Connect the camper side first, then the campsite pillar. Everything charges automatically once hooked up, and the sockets inside go live.',
      },
      {
        heading: 'What can I run?',
        body:
          'On battery: lights, water pump, fridge, USB, diesel heating — for a weekend easily. NOT on battery: kettles, hair dryers, induction hobs. Those need 230V hookup.',
        warning: 'A flat leisure battery under 11.5V can be permanently damaged. If the panel alarm beeps, start the engine or hook up.',
      },
    ],
  },
  {
    id: 'gas',
    title: 'Gas system',
    icon: '🔥',
    summary: 'Bottle location, valves, cooking safely, swapping bottles.',
    sections: [
      {
        heading: 'Where it lives',
        body:
          'Two 11kg propane bottles sit in the sealed gas locker at the rear. The main valve is on top of the bottle — righty-tighty closed for driving on ferries and at return, open a half turn for use.',
      },
      {
        heading: 'Cooking',
        body:
          'Open the bottle valve and the burner-line valve (blue tap behind the kitchen drawer), push and turn the knob, and light. Close the burner-line valve when done. Crack a window while cooking — the hob eats oxygen.',
      },
      {
        heading: 'Swapping a bottle',
        body:
          'Bottles are exchanged at most OMV, Shell and dedicated "газ" stations. Close the valve, unscrew the regulator counter-clockwise (left-hand thread!), swap, and check the joint with soapy water.',
        warning: 'If you ever smell gas: close the bottle valve, open doors and windows, no flames or switches. Then call us.',
      },
    ],
  },
  {
    id: 'toilet',
    title: 'Toilet & cassette',
    icon: '🚽',
    summary: 'Using the cassette toilet and emptying it without tears.',
    sections: [
      {
        heading: 'Using it',
        body:
          'Open the blade with the lever under the bowl before use, close it after. The flush button is on the panel next to the seat. Add one dose of the green fluid from the bathroom locker after each emptying — it kills smells.',
      },
      {
        heading: 'Emptying the cassette',
        body:
          'The cassette pulls out from the hatch outside. Empty it at campsite chemical toilet points every 2–3 days. Point the spout down, press the vent button WHILE pouring, and rinse twice with water.',
        warning: 'Only empty at marked chemical WC points. And really — press the vent button, or physics will happen.',
      },
    ],
  },
  {
    id: 'heating',
    title: 'Heating & fridge',
    icon: '🌡️',
    summary: 'Diesel heater, fridge power sources, hot water.',
    sections: [
      {
        heading: 'Diesel heating',
        body:
          'The heater runs on the vehicle diesel tank and the leisure battery. Set the temperature on the panel dial; it needs a few minutes to prime. It will not start if the fuel tank is below a quarter — by design, so you can always drive away.',
      },
      {
        heading: 'Fridge',
        body:
          'The compressor fridge runs on 12V always — driving, parked, or hooked up. It uses about 15% of the battery per day at summer temperatures. Level the van at camp; compressors dislike sleeping on a slope.',
      },
      {
        heading: 'Hot water',
        body:
          'The boiler shares the diesel heater. Switch the panel to "water" or "both"; you have 10 litres of hot water about 20 minutes later. That is two short showers — navy style, please.',
      },
    ],
  },
  {
    id: 'driving',
    title: 'Driving in Bulgaria',
    icon: '🛣️',
    summary: 'Vignettes, mountain passes, dimensions, where you may sleep.',
    sections: [
      {
        heading: 'Vignette & rules',
        body:
          'The camper carries a valid e-vignette for all national roads — nothing to display. Headlights on at all times, day and night, all year. Blood alcohol limit is 0.5‰, and police checks are common on OPasses.',
      },
      {
        heading: 'Know your size',
        body:
          'Your camper height and length are on the keyring tag and the dashboard sticker. Watch for low branches in villages, and old town streets are narrower than navigation thinks. When in doubt, park outside and walk in.',
      },
      {
        heading: 'Mountain passes',
        body:
          'Shipka, Troyan, Petrohan and the Rhodope roads are spectacular but slow — average 40 km/h and use engine braking downhill instead of riding the brakes. Fuel up before long mountain sections; stations get sparse.',
      },
      {
        heading: 'Overnighting',
        body:
          'Wild camping tolerance varies; official campsites are cheap (15–30 lv) and increasingly good. Our app map marks camper-friendly spots. Avoid sleeping in city streets and national park core zones — both are fineable.',
        warning: 'Never overnight in lay-bys on the Trakia and Hemus motorways. Use guarded truck stops or campsites.',
      },
    ],
  },
  {
    id: 'trouble',
    title: 'Troubleshooting & contacts',
    icon: '🆘',
    summary: 'Common fixes and who to call when they do not work.',
    sections: [
      {
        heading: 'Nothing electrical works',
        body:
          'Check the main 12V breaker above the leisure battery (under the passenger seat). If the panel shows under 11.5V, run the engine for 30 minutes or hook up to 230V.',
      },
      {
        heading: 'Water pump runs but no water',
        body:
          'Tank is empty or the pump lost prime. Fill the tank, open the cold tap fully and wait 30 seconds. Still nothing? Check the inline filter behind the kitchen kick panel.',
      },
      {
        heading: 'Heater blows cold / stops',
        body:
          'Usually low battery or low diesel. Fix either, then restart the heater twice — it purges and re-primes on the second attempt.',
      },
      {
        heading: 'Who to call',
        body:
          'The Stable 24/7 line: +359 88 555 0142 (also on the key tag). Roadside assistance is included — call us first, we dispatch. EU emergency number: 112.',
      },
    ],
  },
];

export function getTopic(id: string): GuideTopic | undefined {
  return GUIDE_TOPICS.find((t) => t.id === id);
}
